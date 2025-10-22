/**
 * Comment Service - Servicio para operaciones de comentarios con Supabase
 */

import supabase from '../config/supabase';
import apiClient from './apiClient';

class CommentService {
  /**
   * Obtiene todos los comentarios con filtros opcionales
   */
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('comments')
        .select('*, profiles:user_id(name, avatar_url)')
        .order('created_at', { ascending: true });

      if (filters.ticketId) {
        query = query.eq('ticket_id', filters.ticketId);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Formatear datos para incluir información del usuario
      const formattedData = (data || []).map(comment => ({
        id: comment.id,
        ticket_id: comment.ticket_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        userName: comment.profiles?.name || 'Usuario',
        userAvatar: comment.profiles?.avatar_url || null,
      }));

      return {
        success: true,
        data: formattedData,
      };
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  /**
   * Obtiene un comentario por ID
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles:user_id(name, avatar_url)')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          ...data,
          userName: data.profiles?.name || 'Usuario',
          userAvatar: data.profiles?.avatar_url || null,
        },
      };
    } catch (error) {
      console.error('Error getting comment:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo comentario (usa el backend para validaciones y lógica)
   */
  async create(commentData) {
    return apiClient.request('/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  /**
   * Actualiza un comentario
   */
  async update(id, userId, content) {
    return apiClient.request(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ userId, content }),
    });
  }

  /**
   * Elimina un comentario
   */
  async delete(id, userId) {
    return apiClient.request(`/comments/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
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

  /**
   * Suscripción en tiempo real a comentarios de un ticket
   */
  subscribeToComments(ticketId, callback) {
    const subscription = supabase
      .channel(`comments-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `ticket_id=eq.${ticketId}`,
        },
        async (payload) => {
          // Si es un nuevo comentario, cargar datos del usuario
          if (payload.eventType === 'INSERT' && payload.new) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', payload.new.user_id)
              .single();

            callback({
              ...payload,
              new: {
                ...payload.new,
                userName: profile?.name || 'Usuario',
                userAvatar: profile?.avatar_url || null,
              },
            });
          } else {
            callback(payload);
          }
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Cancela suscripción a comentarios
   */
  unsubscribeFromComments(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
}

export default new CommentService();