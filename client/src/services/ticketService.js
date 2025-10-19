/**
 * Ticket Service - Servicio para operaciones de tickets
 */

import apiClient from "./apiClient";

class TicketService {
  /**
   * Obtiene todos los tickets con filtros opcionales
   */
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiClient.request(`/tickets?${params}`);
  }

  /**
   * Obtiene un ticket por ID
   */
  async getById(id) {
    return apiClient.request(`/tickets/${id}`);
  }

  /**
   * Crea un nuevo ticket (reportar)
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
   * Acepta un ticket para limpiar
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
}

export default new TicketService();
