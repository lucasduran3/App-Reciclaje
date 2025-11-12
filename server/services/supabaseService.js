/**
 * SupabaseService - Servicio de acceso a Supabase
 */

import supabase from "../config/supabase.js";
import { randomBytes } from "crypto";

class SupabaseService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Inicializa el servicio y verifica la conexión
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Verificar conexión
      const { error } = await supabase
        .from("profiles")
        .select("count")
        .limit(1);

      if (error) throw error;

      this.initialized = true;
      console.log("SupabaseService initialized successfully");
    } catch (error) {
      console.error("Error initializing SupabaseService:", error.message);
      throw error;
    }
  }

  /**
   * Obtiene todos los registros de una tabla
   */
  async getAll(table, options = {}) {
    try {
      let query = supabase.from(table).select("*");

      // Aplicar filtros si existen
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Aplicar ordenamiento
      if (options.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.ascending !== false,
        });
      }

      // Aplicar límite
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error(`Error getting all from ${table}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene un registro por ID
   */
  async getById(table, id) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Error getting ${table} by id:`, error);
      throw error;
    }
  }

  /**
   * Crea un nuevo registro
   */
  async create(table, data) {
    try {
      const { data: created, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      return created;
    } catch (error) {
      console.error(`Error creating in ${table}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza un registro
   */
  async update(table, id, updates) {
    try {
      const { data: updated, error } = await supabase
        .from(table)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return updated;
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un registro
   */
  async delete(table, id) {
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      throw error;
    }
  }

  /**
   * Ejecuta una query personalizada
   */
  async query(table, queryBuilder) {
    try {
      let query = supabase.from(table).select("*");

      if (queryBuilder) {
        query = queryBuilder(query);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error(`Error querying ${table}:`, error);
      throw error;
    }
  }

  /**
   * Cuenta registros en una tabla
   */
  async count(table, filters = {}) {
    try {
      let query = supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { count, error } = await query;

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error(`Error counting ${table}:`, error);
      throw error;
    }
  }

  /**
   * Sube una fota a supabase storage
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
   * Elimina una foto del storage de supabase
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

  /**
   * Obtiene el cliente de Supabase directamente
   * Para operaciones complejas que no están cubiertas
   */
  getClient() {
    return supabase;
  }
}

// Exportar instancia singleton
export default new SupabaseService();
