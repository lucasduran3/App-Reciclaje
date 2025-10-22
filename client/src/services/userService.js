/**
 * User Service - Servicio para operaciones de usuarios con Supabase
 */

import supabase from '../config/supabase';
import apiClient from './apiClient';

class UserService {
  /**
   * Obtiene todos los usuarios (perfiles públicos)
   */
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('preferences->>public_profile', 'true')
        .order('points', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Obtiene un usuario por ID
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de un usuario
   */
  async getStats(id) {
    try {
      // Obtener perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;

      // Obtener conteos de tickets
      const [reportedCount, acceptedCount, validatedCount] = await Promise.all([
        supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('reported_by', id),
        supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('accepted_by', id),
        supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('validated_by', id),
      ]);

      return {
        success: true,
        data: {
          user: {
            id: profile.id,
            name: profile.name,
            avatar_url: profile.avatar_url,
            points: profile.points,
            level: profile.level,
            streak: profile.streak,
            zone: profile.zone,
          },
          stats: profile.stats,
          badges: profile.badges,
          tickets: {
            reported: reportedCount.count || 0,
            accepted: acceptedCount.count || 0,
            validated: validatedCount.count || 0,
          },
        },
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Actualiza un usuario
   */
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Elimina un usuario (usar con precaución)
   */
  async delete(id) {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Agrega puntos a un usuario (usa el backend para lógica compleja)
   */
  async addPoints(id, points, reason) {
    return apiClient.request(`/users/${id}/add-points`, {
      method: 'POST',
      body: JSON.stringify({ points, reason }),
    });
  }
}

export default new UserService();