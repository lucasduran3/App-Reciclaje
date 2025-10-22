/**
 * Upload Image Helper - Utilidad para subir imágenes a Supabase Storage
 */

import supabase from "../config/supabase";

/**
 * Sube una imagen a Supabase Storage
 * @param {File} file - Archivo de imagen
 * @param {string} bucket - Nombre del bucket (ej: 'ticket-photos', 'avatars')
 * @param {string} folder - Carpeta dentro del bucket (opcional)
 * @returns {Promise<string>} URL pública de la imagen
 */
export async function uploadImage(file, bucket = "ticket-photos", folder = "") {
  try {
    // Validar archivo
    if (!file) {
      throw new Error("No file provided");
    }

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only JPG, PNG and WebP are allowed");
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit");
    }

    // Generar nombre único
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Subir archivo
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

/**
 * Sube múltiples imágenes
 * @param {File[]} files - Array de archivos
 * @param {string} bucket - Nombre del bucket
 * @param {string} folder - Carpeta dentro del bucket
 * @returns {Promise<string[]>} Array de URLs públicas
 */
export async function uploadMultipleImages(
  files,
  bucket = "ticket-photos",
  folder = ""
) {
  try {
    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    const uploadPromises = files.map((file) =>
      uploadImage(file, bucket, folder)
    );
    const urls = await Promise.all(uploadPromises);

    return urls;
  } catch (error) {
    console.error("Error uploading multiple images:", error);
    throw error;
  }
}

/**
 * Elimina una imagen de Supabase Storage
 * @param {string} url - URL pública de la imagen
 * @param {string} bucket - Nombre del bucket
 * @returns {Promise<boolean>} True si se eliminó correctamente
 */
export async function deleteImage(url, bucket = "ticket-photos") {
  try {
    // Extraer el path de la URL
    const urlParts = url.split(`/${bucket}/`);
    if (urlParts.length < 2) {
      throw new Error("Invalid image URL");
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
}

/**
 * Redimensiona una imagen antes de subirla (opcional)
 * @param {File} file - Archivo de imagen
 * @param {number} maxWidth - Ancho máximo
 * @param {number} maxHeight - Alto máximo
 * @returns {Promise<Blob>} Imagen redimensionada
 */
export async function resizeImage(file, maxWidth = 1200, maxHeight = 1200) {
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

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          file.type,
          0.85 // Calidad
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
