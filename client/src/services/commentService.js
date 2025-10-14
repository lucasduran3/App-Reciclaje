/**
 * Comment Service - Servicio para operaciones de comentarios
 */

import apiClient from './apiClient';

class CommentService {
  /**
   * Obtiene todos los comentarios con filtros opcionales
   */
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiClient.request(`/comments?${params}`);
  }

  /**
   * Obtiene un comentario por ID
   */
  async getById(id) {
    return apiClient.request(`/comments/${id}`);
  }

  /**
   * Crea un nuevo comentario
   */
  async create(commentData) {
    return apiClient.request('/comments', {
      method: 'POST',
      body: JSON.stringify(commentData)
    });
  }

  /**
   * Actualiza un comentario
   */
  async update(id, userId, content) {
    return apiClient.request(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ userId, content })
    });
  }

  /**
   * Elimina un comentario
   */
  async delete(id, userId) {
    return apiClient.request(`/comments/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId })
    });
  }

  /**
   * Da o quita like a un comentario
   */
  async like(id, userId) {
    return apiClient.request(`/comments/${id}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  /**
   * Obtiene comentarios de un ticket
   */
  async getByTicket(ticketId) {
    return this.getAll({ ticketId });
  }

  /**
   * Obtiene comentarios de un usuario
   */
  async getByUser(userId) {
    return this.getAll({ userId });
  }
}

export default new CommentService();