/**
 * Leaderboard Service - Servicio para operaciones de rankings con Supabase
 */

import supabase from '../config/supabase';

class LeaderboardService {
  /**
   * Obtiene el leaderboard con filtros opcionales
   */
  async get(filters = {}) {
    try {
      const { zone, limit = 100 } = filters;

      let query = supabase
        .from('profiles')
        .select('id, name, avatar_url, points, zone, level, streak, badges')
        .eq('preferences->>public_profile', 'true')
        .order('points', { ascending: false })
        .limit(parseInt(limit));

      if (zone) {
        query = query.eq('zone', zone);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Agregar posiciones
      const leaderboard = (data || []).map((user, index) => ({
        userId: user.id,
        name: user.name,
        avatar: user.avatar_url,
        points: user.points,
        zone: user.zone,
        level: user.level,
        streak: user.streak,
        badges: user.badges,
        position: index + 1,
        weeklyPoints: 0, // Calcular si es necesario
      }));

      return {
        success: true,
        type: zone ? 'zone' : 'global',
        zone: zone || null,
        count: leaderboard.length,
        data: leaderboard,
      };
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  /**
   * Obtiene la posición de un usuario en el leaderboard
   */
  async getUserPosition(userId, zone = null) {
    try {
      // Obtener el usuario
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Obtener todos los usuarios para calcular posición
      let query = supabase
        .from('profiles')
        .select('id, points')
        .eq('preferences->>public_profile', 'true')
        .order('points', { ascending: false });

      if (zone) {
        query = query.eq('zone', zone);
      }

      const { data: allUsers, error: allError } = await query;

      if (allError) throw allError;

      // Encontrar posición
      const position = allUsers.findIndex((u) => u.id === userId) + 1;

      if (position === 0) {
        throw new Error('User not found in leaderboard');
      }

      return {
        success: true,
        data: {
          userId: user.id,
          name: user.name,
          avatar: user.avatar_url,
          points: user.points,
          zone: user.zone,
          level: user.level,
          streak: user.streak,
          position,
          totalPlayers: allUsers.length,
          weeklyPoints: 0, // Calcular si es necesario
        },
      };
    } catch (error) {
      console.error('Error getting user position:', error);
      throw error;
    }
  }

  /**
   * Regenera el leaderboard (no necesario con Supabase en tiempo real)
   */
  async regenerate() {
    // Con Supabase esto no es necesario, pero mantenemos
    // la función por compatibilidad
    return this.get({ limit: 100 });
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

  /**
   * Suscripción en tiempo real a cambios en el leaderboard
   */
  subscribeToLeaderboard(callback) {
    const subscription = supabase
      .channel('leaderboard-channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          // Solo notificar si cambió los puntos
          if (payload.new.points !== payload.old.points) {
            callback(payload);
          }
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Cancela suscripción al leaderboard
   */
  unsubscribeFromLeaderboard(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
}

export default new LeaderboardService();