/**
 * Ticket Service - Servicio para operaciones de tickets con Supabase
 */

import supabase from "../config/supabase";
import apiClient from "./apiClient";

class TicketService {
  /**
   * Obtiene todos los tickets con filtros opcionales
   */
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.zone) {
        query = query.eq("zone", filters.zone);
      }
      if (filters.type) {
        query = query.eq("type", filters.type);
      }
      if (filters.reportedBy) {
        query = query.eq("reported_by", filters.reportedBy);
      }
      if (filters.acceptedBy) {
        query = query.eq("accepted_by", filters.acceptedBy);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("Error getting tickets:", error);
      throw error;
    }
  }

  /**
   * Obtiene un ticket por ID
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Incrementar vistas (no esperar la respuesta)
      this.incrementViews(id, data.interactions);

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error getting ticket:", error);
      throw error;
    }
  }

  /**
   * Incrementa las vistas de un ticket
   */
  async incrementViews(id, currentInteractions) {
    try {
      const interactions = currentInteractions || {
        likes: 0,
        views: 0,
        comments: 0,
        liked_by: [],
      };

      interactions.views = (interactions.views || 0) + 1;

      await supabase.from("tickets").update({ interactions }).eq("id", id);
    } catch (error) {
      console.error("Error incrementing views:", error);
      // No lanzar error, es una operación en background
    }
  }

  /**
   * Crea un nuevo ticket (usa el backend para validaciones)
   */
  async create(ticketData) {
    return apiClient.request("/tickets", {
      method: "POST",
      body: JSON.stringify(ticketData),
    });
  }

  /**
   * Actualiza un ticket
   */
  async update(id, updates) {
    return apiClient.request(`/tickets/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  /**
   * Elimina un ticket
   */
  async delete(id) {
    return apiClient.request(`/tickets/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Acepta un ticket para limpiar (usa el backend para lógica compleja)
   */
  async accept(id, userId) {
    return apiClient.request(`/tickets/${id}/accept`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  /**
   * Marca un ticket como completado
   */
  async complete(id, data) {
    return apiClient.request(`/tickets/${id}/complete`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Valida un ticket completado
   */
  async validate(id, userId, approved, rejectionReason) {
    return apiClient.request(`/tickets/${id}/validate`, {
      method: "POST",
      body: JSON.stringify({ userId, approved, rejectionReason }),
    });
  }

  /**
   * Da o quita like a un ticket
   */
  async like(id, userId) {
    return apiClient.request(`/tickets/${id}/like`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  /**
   * Añade un comentario a un ticket
   */
  async addComment(id, userId, text) {
    return apiClient.request(`/tickets/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ userId, text }),
    });
  }

  /**
   * Obtiene tickets por usuario
   */
  async getByUser(userId, role = "reported") {
    const filterMap = {
      reported: { reportedBy: userId },
      accepted: { acceptedBy: userId },
      validated: { validatedBy: userId },
    };

    return this.getAll(filterMap[role] || {});
  }

  /**
   * Obtiene tickets por zona
   */
  async getByZone(zone) {
    return this.getAll({ zone });
  }

  /**
   * Obtiene tickets por estado
   */
  async getByStatus(status) {
    return this.getAll({ status });
  }

  /**
   * Suscripción en tiempo real a cambios en tickets
   */
  subscribeToTickets(callback) {
    const subscription = supabase
      .channel("tickets-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Cancela suscripción
   */
  unsubscribeFromTickets(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }

  /**
   * Crea un nuevo ticket con imagen
   * @param {Object} ticketData - Datos del ticket
   * @param {File|string} photo - Archivo de imagen o base64
   * @returns {Promise<Object>} Ticket creado
   */
  async createWithPhoto(ticketData, photo) {
    try {
      // Obtener token de sesión actual
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Usuario no autenticado");
      }

      let photoBase64 = photo;

      // Si photo es un File, convertirlo a base64
      if (photo instanceof File) {
        photoBase64 = await this.fileToBase64(photo);
      }

      // Preparar datos del ticket
      const ticketPayload = {
        ...ticketData,
        photo_before: photoBase64,
        reported_by: session.user.id,
      };

      // Enviar al backend con token de autenticación
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api"
        }/tickets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(ticketPayload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.errors?.join(", ") || "Error al crear ticket"
        );
      }

      return data;
    } catch (error) {
      console.error("Error creating ticket with photo:", error);
      throw error;
    }
  }

  /**
   * Convierte un File a base64
   * @param {File} file - Archivo de imagen
   * @returns {Promise<string>} Imagen en formato base64
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      // Validar tipo de archivo
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        reject(new Error("Tipo de archivo no permitido. Usa JPG, PNG o WebP"));
        return;
      }

      // Validar tamaño (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        reject(new Error("La imagen excede el tamaño máximo de 5MB"));
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result); // Devuelve data:image/jpeg;base64,....
      };

      reader.onerror = (error) => {
        reject(new Error("Error al leer el archivo"));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Redimensiona una imagen si es muy grande (opcional, para optimizar)
   * @param {File} file - Archivo de imagen
   * @param {number} maxWidth - Ancho máximo
   * @param {number} maxHeight - Alto máximo
   * @returns {Promise<string>} Imagen redimensionada en base64
   */
  async resizeImage(file, maxWidth = 1920, maxHeight = 1080) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calcular nuevas dimensiones manteniendo aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a base64 con calidad optimizada
          const resizedBase64 = canvas.toDataURL(file.type, 0.85);
          resolve(resizedBase64);
        };

        img.onerror = () => reject(new Error("Error al cargar la imagen"));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error("Error al leer el archivo"));
      reader.readAsDataURL(file);
    });
  }
}

export default new TicketService();
