/**
 * Leaderboard Service - Servicio para operaciones de rankings
 */

import apiClient from './apiClient';

class LeaderboardService {
  /**
   * Obtiene el leaderboard con filtros opcionales
   */
  async get(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiClient.request(`/leaderboard?${params}`);
  }

  /**
   * Obtiene la posición de un usuario en el leaderboard
   */
  async getUserPosition(userId, zone = null) {
    const params = zone ? `?zone=${zone}` : '';
    return apiClient.request(`/leaderboard/user/${userId}${params}`);
  }

  /**
   * Regenera el leaderboard
   */
  async regenerate() {
    return apiClient.request('/leaderboard/regenerate', {
      method: 'POST'
    });
  }

  /**
   * Obtiene el leaderboard global
   */
  async getGlobal(limit = 100) {
    return this.get({ limit });
  }

  /**
   * Obtiene el leaderboard por zona
   */
  async getByZone(zone, limit = 50) {
    return this.get({ zone, limit });
  }

  /**
   * Obtiene el top 10 global
   */
  async getTop10() {
    return this.get({ limit: 10 });
  }

  /**
   * Obtiene el top 10 por zona
   */
  async getTop10ByZone(zone) {
    return this.get({ zone, limit: 10 });
  }
}

export default new LeaderboardService();