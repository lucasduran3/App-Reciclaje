/**
 * Comment - Comentario en un ticket
 * 
 * Representa comentarios que los usuarios hacen en tickets
 * para coordinar, preguntar o felicitar.
 */

export interface Comment {
  id: string;                      // UUID único del comentario
  ticketId: string;                // ID del ticket al que pertenece
  userId: string;                  // ID del usuario que comentó
  userName: string;                // Nombre del usuario (desnormalizado para performance)
  userAvatar: string;              // Avatar del usuario (desnormalizado)
  content: string;                 // Contenido del comentario (max 500 chars)
  likes: number;                   // Cantidad de likes recibidos
  likedBy: string[];               // IDs de usuarios que dieron like
  createdAt: string;               // ISO 8601 timestamp de creación
  updatedAt?: string;              // ISO 8601 timestamp si fue editado (opcional)
}