/**
 * Mission Service - Servicio para operaciones de misiones con Supabase
 */

import supabase from '../config/supabase';
import apiClient from './apiClient';

class MissionService {
  /**
   * Obtiene todas las misiones con el progreso del usuario
   */
  async getAll(filters = {}, userId = null) {
    try {
      let query = supabase
        .from('missions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      const { data: missions, error } = await query;

      if (error) throw error;

      // Si hay userId, obtener el progreso del usuario para cada misión
      if (userId) {
        const { data: userMissions } = await supabase
          .from('user_missions')
          .select('*')
          .eq('user_id', userId);

        // Combinar misiones con progreso del usuario
        const missionsWithProgress = missions.map(mission => {
          const userMission = userMissions?.find(um => um.mission_id === mission.id);
          
          return {
            ...mission,
            progress: userMission?.progress || 0,
            completed: userMission?.completed || false,
            started_at: userMission?.started_at || null,
            completed_at: userMission?.completed_at || null,
          };
        });

        return {
          success: true,
          data: missionsWithProgress,
        };
      }

      return {
        success: true,
        data: missions || [],
      };
    } catch (error) {
      console.error('Error getting missions:', error);
      throw error;
    }
  }

  /**
   * Obtiene una misión por ID
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error getting mission:', error);
      throw error;
    }
  }

  /**
   * Actualiza una misión
   */
  async update(id, updates) {
    return apiClient.request(`/missions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Incrementa el progreso de una misión (usa el backend para lógica compleja)
   */
  async incrementProgress(id, userId, amount = 1) {
    return apiClient.request(`/missions/${id}/increment`, {
      method: 'POST',
      body: JSON.stringify({ userId, amount }),
    });
  }

  /**
   * Regenera misiones diarias o semanales
   */
  async regenerate(type) {
    return apiClient.request('/missions/regenerate', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  /**
   * Obtiene misiones activas (no completadas) para un usuario
   */
  async getActive(userId) {
    try {
      const missions = await this.getAll({}, userId);
      
      const activeMissions = missions.data.filter(m => !m.completed);

      return {
        success: true,
        data: activeMissions,
      };
    } catch (error) {
      console.error('Error getting active missions:', error);
      throw error;
    }
  }

  /**
   * Obtiene misiones completadas para un usuario
   */
  async getCompleted(userId) {
    try {
      const missions = await this.getAll({}, userId);
      
      const completedMissions = missions.data.filter(m => m.completed);

      return {
        success: true,
        data: completedMissions,
      };
    } catch (error) {
      console.error('Error getting completed missions:', error);
      throw error;
    }
  }

  /**
   * Obtiene misiones por tipo para un usuario
   */
  async getByType(type, userId) {
    return this.getAll({ type }, userId);
  }

  /**
   * Obtiene misiones diarias activas para un usuario
   */
  async getDailyActive(userId) {
    try {
      const missions = await this.getAll({ type: 'daily' }, userId);
      
      const activeMissions = missions.data.filter(m => !m.completed);

      return {
        success: true,
        data: activeMissions,
      };
    } catch (error) {
      console.error('Error getting daily active missions:', error);
      throw error;
    }
  }

  /**
   * Obtiene misiones semanales activas para un usuario
   */
  async getWeeklyActive(userId) {
    try {
      const missions = await this.getAll({ type: 'weekly' }, userId);
      
      const activeMissions = missions.data.filter(m => !m.completed);

      return {
        success: true,
        data: activeMissions,
      };
    } catch (error) {
      console.error('Error getting weekly active missions:', error);
      throw error;
    }
  }

  /**
   * Suscripción en tiempo real a cambios en misiones
   */
  subscribeToMissions(userId, callback) {
    const subscription = supabase
      .channel(`missions-user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_missions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Cancela suscripción a misiones
   */
  unsubscribeFromMissions(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
}

export default new MissionService();