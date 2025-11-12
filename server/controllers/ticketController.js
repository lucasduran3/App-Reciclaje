import supabaseService from "../services/supabaseService.js";
import supabase from "../config/supabase.js";
import { randomBytes } from "crypto";
import { validateTicketStatusTransition } from "../services/validationService.js";
import { calculateTicketPoints } from "../services/pointsService.js";
import { validationResult } from "express-validator";

class TicketController {
  /**
   * GET /api/tickets
   * Obtiene todos los tickets con filtros opcionales
   */
  async getAll(req, res, next) {
    try {
      const { status, zone, type, reportedBy, acceptedBy } = req.query;

      let tickets = await supabaseService.query("tickets", (query) => {
        let q = query.order("created_at", { ascending: false });

        if (status) q = q.eq("status", status);
        if (zone) q = q.eq("zone", zone);
        if (type) q = q.eq("type", type);
        if (reportedBy) q = q.eq("reported_by", reportedBy);
        if (acceptedBy) q = q.eq("accepted_by", acceptedBy);

        return q;
      });

      res.json({
        success: true,
        count: tickets.length,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tickets/:id
   * Obtiene un ticket por ID e incrementa vistas
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const ticket = await supabaseService.getById("tickets", id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket not found",
        });
      }

      // Incrementar vistas
      const interactions = ticket.interactions || {
        likes: 0,
        views: 0,
        comments: 0,
        liked_by: [],
      };
      interactions.views = (interactions.views || 0) + 1;

      await supabaseService.update("tickets", id, { interactions });

      // Devolver ticket con vistas actualizadas
      ticket.interactions = interactions;

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tickets
   * Crea un nuevo ticket con upload de imagen a Supabase Storage
   */
  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Obtener userId del token (implementar middleware de auth)
      const userId = req.user?.id || req.body.reported_by;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
        });
      }

      const ticketData = req.body;

      // Verificar que el usuario existe
      const user = await supabaseService.getById("profiles", userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      // Subir foto a Supabase Storage
      let photoUrl;

      if (ticketData.photo_before.startsWith("data:")) {
        // Es base64, necesitamos subirla
        photoUrl = await this.uploadPhotoToStorage(
          ticketData.photo_before,
          userId
        );
      } else if (ticketData.photo_before.startsWith("http")) {
        // Ya es una URL (foto ya subida)
        photoUrl = ticketData.photo_before;
      } else {
        return res.status(400).json({
          success: false,
          error: "Formato de foto inválido",
        });
      }

      // Crear ticket en la base de datos
      const newTicket = {
        title: ticketData.title.trim(),
        description: ticketData.description.trim(),
        location: `(${ticketData.location.lat},${ticketData.location.lng})`, // PostGIS point
        address: ticketData.address.trim(),
        zone: ticketData.zone,
        type: ticketData.type,
        priority: ticketData.priority,
        estimated_size: ticketData.estimated_size,
        status: "reported",
        reported_by: userId,
        photos_before: [photoUrl], // Array de URLs
        interactions: {
          likes: 0,
          comments: 0,
          views: 0,
          liked_by: [],
        },
      };

      const createdTicket = await supabaseService.create("tickets", newTicket);

      // Actualizar stats del usuario
      const stats = user.stats || {};
      stats.tickets_reported = (stats.tickets_reported || 0) + 1;
      await supabaseService.update("profiles", userId, { stats });

      // Dar puntos al reportante (50 puntos)
      await supabaseService.update("profiles", userId, {
        points: user.points + 50,
      });

      res.status(201).json({
        success: true,
        message: "Ticket creado exitosamente",
        data: createdTicket,
      });
    } catch (error) {
      console.error("Error creating ticket:", error);
      next(error);
    }
  }

  /**
   * POST /api/tickets/:id/accept
   * Acepta un ticket para limpiar
   */
  async accept(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const ticket = await supabaseService.getById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket no encontrado",
        });
      }

      if (ticket.status !== "reported") {
        return res.status(400).json({
          success: false,
          error: "El ticket no se puede aceptar",
        });
      }

      if (ticket.reported_by === userId) {
        return res.status(400).json({
          success: false,
          error: "No puedes aceptar tu propio ticket",
        });
      }

      const user = await supabaseService.getById("profiles", userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      // Actualizar ticket
      const updatedTicket = await supabaseService.update("tickets", id, {
        status: "accepted",
        accepted_by: userId,
        accepted_at: new Date().toISOString(),
      });

      // Actualizar stats del usuario
      const stats = user.stats || {};
      stats.tickets_accepted = (stats.tickets_accepted || 0) + 1;
      await supabaseService.update("profiles", userId, { stats });

      // Dar puntos
      const userController = (await import("./userController.js")).default;
      await userController.addPoints(
        {
          params: { id: userId },
          body: { points: 20, reason: "Ticket aceptado" },
        },
        { json: () => {} },
        () => {}
      );

      res.json({
        success: true,
        message: "Ticket aceptado con éxito",
        data: updatedTicket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tickets/:id/complete
   * Marca un ticket como completado (limpieza terminada)
   */
  async complete(req, res, next) {
    try {
      const { id } = req.params;
      const { photo_after, cleaning_status } = req.body;

      // Obtener userId del token (viene del middleware de auth)
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
        });
      }

      // Validaciones básicas
      if (!photo_after) {
        return res.status(400).json({
          success: false,
          error: 'Foto "después" es requerida',
        });
      }

      if (
        !cleaning_status ||
        !["partial", "complete"].includes(cleaning_status)
      ) {
        return res.status(400).json({
          success: false,
          error: "Estado de limpieza inválido (partial o complete)",
        });
      }

      // Obtener ticket
      const ticket = await supabaseService.getById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket no encontrado",
        });
      }

      // Regla de negocio 1: Solo el cleaner puede completar
      if (ticket.accepted_by !== userId) {
        return res.status(403).json({
          success: false,
          error: "Solo el usuario que aceptó el ticket puede completarlo",
        });
      }

      // Regla de negocio 2: El reporter no puede completar su propio ticket
      if (ticket.reported_by === userId) {
        return res.status(403).json({
          success: false,
          error: "No puedes completar tu propio ticket",
        });
      }

      // Regla de negocio 3: El ticket debe estar en estado permitido
      if (ticket.status !== "accepted" && ticket.status !== "in_progress") {
        return res.status(400).json({
          success: false,
          error: `Ticket no puede ser completado en estado "${ticket.status}"`,
        });
      }

      // Subir foto a Supabase Storage
      let photoUrl;
      if (photo_after.startsWith("data:")) {
        photoUrl = await this.uploadPhotoToStorage(photo_after, userId);
      } else if (photo_after.startsWith("http")) {
        photoUrl = photo_after;
      } else {
        return res.status(400).json({
          success: false,
          error: "Formato de foto inválido",
        });
      }

      // Actualizar ticket
      const updatedTicket = await supabaseService.update("tickets", id, {
        status: "validating",
        photos_after: [photoUrl],
        cleaning_status: cleaning_status,
        validation_type: "photo",
        validation_status: "pending",
      });

      // Obtener cleaner para actualizar stats y puntos
      const cleaner = await supabaseService.getById("profiles", userId);
      if (cleaner) {
        // Calcular puntos según cleaning_status y prioridad
        const basePoints = cleaning_status === "complete" ? 100 : 50;
        const priorityMultiplier = {
          low: 1.0,
          medium: 1.2,
          high: 1.5,
          urgent: 2.0,
        };
        const sizeMultiplier = {
          small: 1.0,
          medium: 1.3,
          large: 1.6,
          xlarge: 2.0,
        };

        const points = Math.round(
          basePoints *
            (priorityMultiplier[ticket.priority] || 1.0) *
            (sizeMultiplier[ticket.estimated_size] || 1.0)
        );

        // Actualizar stats
        const stats = cleaner.stats || {};
        stats.tickets_cleaned = (stats.tickets_cleaned || 0) + 1;

        await supabaseService.update("profiles", userId, {
          stats,
          points: cleaner.points + points,
        });
      }

      res.json({
        success: true,
        message: "Ticket completado exitosamente. En espera de validación",
        data: {
          ticket: updatedTicket,
          pointsAwarded: cleaner
            ? Math.round(
                (cleaning_status === "complete" ? 100 : 50) *
                  (ticket.priority === "urgent"
                    ? 2.0
                    : ticket.priority === "high"
                    ? 1.5
                    : ticket.priority === "medium"
                    ? 1.2
                    : 1.0) *
                  (ticket.estimated_size === "xlarge"
                    ? 2.0
                    : ticket.estimated_size === "large"
                    ? 1.6
                    : ticket.estimated_size === "medium"
                    ? 1.3
                    : 1.0)
              )
            : 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tickets/:id/validate
   * Valida un ticket completado
   */
  async validate(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { approved, validation_message } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      const ticket = await supabaseService.getById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket no encontrado",
        });
      }

      // Validaciones de estado de ticket
      if (ticket.reported_by !== userId) {
        return res.status(403).json({
          succes: false,
          error: "Solo el reportante puede validar este ticket",
        });
      }

      if (ticket.status !== "validating") {
        return res.status(400).json({
          success: false,
          error: "El ticket no esta esperando validación",
        });
      }

      if (approved) {
        // Validación aprobada - completar ticket
        const points = calculateTicketPoints(ticket);

        const updatedTicket = await supabaseService.update("tickets", id, {
          status: "completed",
          validated_by: userId,
          validation_status: "approved",
          validated_at: new Date().toISOString(),
          validation_message: validation_message || null,
          points_awarded: points,
          completed_at: new Date().toISOString(),
        });

        // Actualizar stats y dar puntos a todos los participantes
        // Limpiador
        if (ticket.accepted_by) {
          const cleaner = await supabaseService.getById(
            "profiles",
            ticket.accepted_by
          );

          if (cleaner) {
            const cleanerStats = cleaner.stats || {};
            cleanerStats.tickets_cleaned =
              (cleanerStats.tickets_cleaned || 0) + 1;

            await supabaseService.update("profiles", ticket.accepted_by, {
              stats: cleanerStats,
              points: cleaner.points + (points.cleaner || 0),
            });
          }
        }

        //actualizar stats del validador
        const validator = await supabaseService.getById("profiles", userId);
        if (validator) {
          const validatorStats = validator.stats || {};
          validatorStats.tickets_validated =
            (validatorStats.tickets_validated || 0) + 1;

          await supabaseService.update("profiles", userId, {
            stats: validatorStats,
            points: validator.points + (points.validator || 0),
          });
        }

        res.json({
          success: true,
          message: "Ticket validado y completado con éxito",
          data: {
            ticket: updatedTicket,
            pointsAwarded: points,
          },
        });
      } else {
        //Validacion rechazada
        //eliminar foto del despues de supabase storage
        if (ticket.photos_after && ticket.photos_after.length > 0) {
          try {
            await this.deletePhotosFromStorage(ticket.photos_after);
          } catch (deleteError) {
            console.error("Error al eliminar fotos: ", deleteError);
            //No bloquear la validacion si falla el borrado
          }
        }

        //actualizar ticket a estado rerpoted
        const updatedTicket = await supabaseService.update("tickets", id, {
          status: "reported",
          validation_status: "rejected",
          validated_by: userId,
          validated_at: new Date().toISOString(),
          validation_message: validation_message || "Limpieza rechazada",
          photos_after: [],
          accepted_by: null,
          accepted_at: null,
          cleaning_status: null,
        });

        res.json({
          succes: true,
          message: "Validacion rechazada. El ticket vuelve a estar disponible",
          data: updatedTicket,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tickets/:id/like
   * Da like a un ticket
   */
  async like(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const ticket = await supabaseService.getById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket no encontrado",
        });
      }

      const user = await supabaseService.getById("profiles", userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      // Obtener interacciones actuales
      const interactions = ticket.interactions || {
        likes: 0,
        views: 0,
        comments: 0,
        liked_by: [],
      };
      const likedBy = interactions.liked_by || [];

      // Verificar si ya dio like
      if (likedBy.includes(userId)) {
        // Quitar like
        interactions.liked_by = likedBy.filter((id) => id !== userId);
        interactions.likes = Math.max(0, (interactions.likes || 0) - 1);
      } else {
        // Agregar like
        interactions.liked_by = [...likedBy, userId];
        interactions.likes = (interactions.likes || 0) + 1;

        // Dar puntos al dueño del ticket
        const reporter = await supabaseService.getById(
          "profiles",
          ticket.reported_by
        );
        if (reporter) {
          const reporterStats = reporter.stats || {};
          reporterStats.likes_received =
            (reporterStats.likes_received || 0) + 1;

          await supabaseService.update("profiles", ticket.reported_by, {
            stats: reporterStats,
            points: reporter.points + 5,
          });
        }

        // Actualizar stats del usuario que dio like
        const userStats = user.stats || {};
        userStats.likes_given = (userStats.likes_given || 0) + 1;
        await supabaseService.update("profiles", userId, { stats: userStats });
      }

      const updatedTicket = await supabaseService.update("tickets", id, {
        interactions,
      });

      res.json({
        success: true,
        message: interactions.liked_by.includes(userId)
          ? "Like added"
          : "Like removed",
        data: updatedTicket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tickets/:id/comments
   * Añade un comentario a un ticket
   */
  async addComment(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { userId, text } = req.body;

      const ticket = await supabaseService.getById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket no encontrado",
        });
      }

      const user = await supabaseService.getById("profiles", userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      const sanitizedText = text
        .trim()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

      const newComment = {
        ticket_id: id,
        user_id: userId,
        content: sanitizedText,
      };

      const createdComment = await supabaseService.create(
        "comments",
        newComment
      );

      // Actualizar contador de comentarios en ticket
      const interactions = ticket.interactions || {
        likes: 0,
        views: 0,
        comments: 0,
        liked_by: [],
      };
      interactions.comments = (interactions.comments || 0) + 1;

      await supabaseService.update("tickets", id, { interactions });

      // Actualizar stats del usuario
      const userStats = user.stats || {};
      userStats.comments_given = (userStats.comments_given || 0) + 1;
      await supabaseService.update("profiles", userId, { stats: userStats });

      res.status(201).json({
        success: true,
        message: "Comment added successfully",
        data: createdComment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/tickets/:id
   * Actualiza un ticket
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const ticket = await supabaseService.getById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket no encontrado",
        });
      }

      // Validar transición de estado si se actualiza
      if (updates.status && updates.status !== ticket.status) {
        const statusValidation = validateTicketStatusTransition(
          ticket.status,
          updates.status
        );
        if (!statusValidation.valid) {
          return res.status(400).json({
            success: false,
            error: statusValidation.error,
          });
        }
      }

      const updatedTicket = await supabaseService.update(
        "tickets",
        id,
        updates
      );

      res.json({
        success: true,
        message: "Ticket actualizado con éxito",
        data: updatedTicket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/tickets/:id
   * Elimina un ticket
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await supabaseService.delete("tickets", id);

      res.json({
        success: true,
        message: "Ticket eliminado con éxito",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper
   * Sube una foto a Supabase Storage
   */
  async uploadPhotoToStorage(base64Data, userId) {
    try {
      // 1. Validar formato base64
      const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);

      if (!matches || matches.length !== 3) {
        throw new Error("Formato de imagen base64 inválido");
      }

      const imageType = matches[1].toLowerCase();
      const base64Content = matches[2];

      // 2. Validar tipo de imagen
      const validTypes = ["jpeg", "jpg", "png", "webp"];
      if (!validTypes.includes(imageType)) {
        throw new Error("Tipo de imagen no permitido. Usa JPG, PNG o WebP");
      }

      // 3. Convertir base64 a Buffer
      const imageBuffer = Buffer.from(base64Content, "base64");

      // 4. Validar tamaño (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (imageBuffer.length > maxSize) {
        throw new Error("La imagen excede el tamaño máximo de 5MB");
      }

      // 5. Generar nombre ÚNICO con hash aleatorio
      const timestamp = Date.now();
      const randomHash = randomBytes(8).toString("hex"); // Hash seguro
      const normalizedType = imageType === "jpg" ? "jpeg" : imageType;
      const fileName = `${userId}/${timestamp}-${randomHash}.${normalizedType}`;

      console.log(`Uploading photo: ${fileName}`);

      // 6. Verificar que el bucket existe
      const { data: buckets, error: bucketError } =
        await supabase.storage.listBuckets();

      if (bucketError) {
        console.error("Error listing buckets:", bucketError);
        throw new Error("Error verificando bucket de almacenamiento");
      }

      const bucketExists = buckets?.some((b) => b.name === "ticket-photos");

      if (!bucketExists) {
        console.error('Bucket "ticket-photos" no existe en Supabase Storage');
        throw new Error('Bucket "ticket-photos" no encontrado. ');
      }

      // 7. Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from("ticket-photos")
        .upload(fileName, imageBuffer, {
          contentType: `image/${normalizedType}`,
          cacheControl: "3600",
          upsert: false, // IMPORTANTE: No sobrescribir si existe
        });

      if (error) {
        console.error("Supabase upload error:", error);

        // Manejar error de archivo duplicado
        if (error.message?.includes("already exists")) {
          // Reintentar con nuevo nombre
          const retryFileName = `${userId}/${timestamp}-${randomBytes(
            8
          ).toString("hex")}.${normalizedType}`;
          console.log(`Retry with: ${retryFileName}`);

          const { data: retryData, error: retryError } = await supabase.storage
            .from("ticket-photos")
            .upload(retryFileName, imageBuffer, {
              contentType: `image/${normalizedType}`,
              cacheControl: "3600",
              upsert: false,
            });

          if (retryError) {
            throw new Error(
              `Error al subir imagen (retry): ${retryError.message}`
            );
          }

          // Obtener URL pública del retry
          const { data: retryUrlData } = supabase.storage
            .from("ticket-photos")
            .getPublicUrl(retryFileName);

          console.log(`Photo uploaded (retry): ${retryUrlData.publicUrl}`);
          return retryUrlData.publicUrl;
        }

        throw new Error(`Error al subir imagen: ${error.message}`);
      }

      // 8. Obtener URL pública
      const { data: urlData } = supabase.storage
        .from("ticket-photos")
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error("No se pudo obtener URL pública de la imagen");
      }

      console.log(`Photo uploaded successfully: ${urlData.publicUrl}`);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error in uploadPhotoToStorage:", error);
      throw error;
    }
  }

  /**
   * Helper
   * Elimina fotos de supabase storage
   */
  async deletePhotosFromStorage(photoUrls) {
    try {
      const filePaths = photoUrls
        .map((url) => {
          // Extraer el path de la URL
          const match = url.match(/ticket-photos\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      if (filePaths.length === 0) return;

      const { error } = await supabase.storage
        .from("ticket-photos")
        .remove(filePaths);

      if (error) {
        console.error("Supabase storage delete error:", error);
        throw error;
      }

      console.log(
        `Successfully deleted ${filePaths.length} photos from storage`
      );
    } catch (error) {
      console.error("Error deleting photos from storage:", error);
      throw error;
    }
  }
}

export default new TicketController();
