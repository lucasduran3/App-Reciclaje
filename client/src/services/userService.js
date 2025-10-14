/**
 * User Service - Servicio para operaciones de usuarios
 */

import apiClient from './apiClient';

class UserService {
  /**
   * Obtiene todos los usuarios
   */
  async getAll() {
    return apiClient.request('/users');
  }

  /**
   * Obtiene un usuario por ID
   */
  async getById(id) {
    return apiClient.request(`/users/${id}`);
  }

  /**
   * Obtiene estadísticas de un usuario
   */
  async getStats(id) {
    return apiClient.request(`/users/${id}/stats`);
  }

  /**
   * Crea un nuevo usuario
   */
  async create(userData) {
    return apiClient.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  /**
   * Actualiza un usuario
   */
  async update(id, updates) {
    return apiClient.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Elimina un usuario
   */
  async delete(id) {
    return apiClient.request(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Agrega puntos a un usuario
   */
  async addPoints(id, points, reason) {
    return apiClient.request(`/users/${id}/add-points`, {
      method: 'POST',
      body: JSON.stringify({ points, reason })
    });
  }
}

export default new UserService();