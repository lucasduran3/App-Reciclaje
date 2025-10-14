/**
 * Mission Service - Servicio para operaciones de misiones
 */

import apiClient from './apiClient';

class MissionService {
  /**
   * Obtiene todas las misiones con filtros opcionales
   */
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiClient.request(`/missions?${params}`);
  }

  /**
   * Obtiene una misión por ID
   */
  async getById(id) {
    return apiClient.request(`/missions/${id}`);
  }

  /**
   * Actualiza una misión
   */
  async update(id, updates) {
    return apiClient.request(`/missions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Incrementa el progreso de una misión
   */
  async incrementProgress(id, userId, amount = 1) {
    return apiClient.request(`/missions/${id}/increment`, {
      method: 'POST',
      body: JSON.stringify({ userId, amount })
    });
  }

  /**
   * Regenera misiones diarias o semanales
   */
  async regenerate(type) {
    return apiClient.request('/missions/regenerate', {
      method: 'POST',
      body: JSON.stringify({ type })
    });
  }

  /**
   * Obtiene misiones activas (no completadas)
   */
  async getActive() {
    return this.getAll({ completed: 'false' });
  }

  /**
   * Obtiene misiones completadas
   */
  async getCompleted() {
    return this.getAll({ completed: 'true' });
  }

  /**
   * Obtiene misiones por tipo
   */
  async getByType(type) {
    return this.getAll({ type });
  }

  /**
   * Obtiene misiones diarias activas
   */
  async getDailyActive() {
    return this.getAll({ type: 'daily', completed: 'false' });
  }

  /**
   * Obtiene misiones semanales activas
   */
  async getWeeklyActive() {
    return this.getAll({ type: 'weekly', completed: 'false' });
  }
}

export default new MissionService();