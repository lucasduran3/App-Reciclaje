/**
 * Ticket Service - Servicio para operaciones de tickets con Supabase
 */

import supabase from '../config/supabase';
import apiClient from './apiClient';

class TicketService {
  /**
   * Obtiene todos los tickets con filtros opcionales
   */
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.zone) {
        query = query.eq('zone', filters.zone);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.reportedBy) {
        query = query.eq('reported_by', filters.reportedBy);
      }
      if (filters.acceptedBy) {
        query = query.eq('accepted_by', filters.acceptedBy);
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
      console.error('Error getting tickets:', error);
      throw error;
    }
  }

  /**
   * Obtiene un ticket por ID
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Incrementar vistas (no esperar la respuesta)
      this.incrementViews(id, data.interactions);

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error getting ticket:', error);
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
        liked_by: [] 
      };
      
      interactions.views = (interactions.views || 0) + 1;

      await supabase
        .from('tickets')
        .update({ interactions })
        .eq('id', id);
    } catch (error) {
      console.error('Error incrementing views:', error);
      // No lanzar error, es una operación en background
    }
  }

  /**
   * Crea un nuevo ticket (usa el backend para validaciones)
   */
  async create(ticketData) {
    return apiClient.request('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  }

  /**
   * Actualiza un ticket
   */
  async update(id, updates) {
    return apiClient.request(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Elimina un ticket
   */
  async delete(id) {
    return apiClient.request(`/tickets/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Acepta un ticket para limpiar (usa el backend para lógica compleja)
   */
  async accept(id, userId) {
    return apiClient.request(`/tickets/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  /**
   * Marca un ticket como completado
   */
  async complete(id, data) {
    return apiClient.request(`/tickets/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Valida un ticket completado
   */
  async validate(id, userId, approved, rejectionReason) {
    return apiClient.request(`/tickets/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ userId, approved, rejectionReason }),
    });
  }

  /**
   * Da o quita like a un ticket
   */
  async like(id, userId) {
    return apiClient.request(`/tickets/${id}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  /**
   * Añade un comentario a un ticket
   */
  async addComment(id, userId, text) {
    return apiClient.request(`/tickets/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ userId, text }),
    });
  }

  /**
   * Obtiene tickets por usuario
   */
  async getByUser(userId, role = 'reported') {
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
      .channel('tickets-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
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
}

export default new TicketService();