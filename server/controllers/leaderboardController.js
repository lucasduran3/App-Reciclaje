/**
 * Leaderboard Controller - Controlador de rankings con Supabase
 */

import supabaseService from "../services/supabaseService.js";

class LeaderboardController {
  /**
   * GET /api/leaderboard
   * Obtiene el leaderboard con filtros opcionales
   */
  async get(req, res, next) {
    try {
      const { zone, limit = 100 } = req.query;

      // Obtener usuarios con perfiles públicos, ordenados por puntos
      let users = await supabaseService.query("profiles", (query) => {
        let q = query
          .eq("preferences->>public_profile", "true")
          .order("points", { ascending: false })
          .limit(parseInt(limit));

        if (zone) {
          q = q.eq("zone", zone);
        }

        return q;
      });

      // Construir leaderboard con posiciones
      const leaderboard = users.map((user, index) => ({
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

      res.json({
        success: true,
        type: zone ? "zone" : "global",
        zone: zone || null,
        count: leaderboard.length,
        data: leaderboard,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/leaderboard/user/:id
   * Obtiene la posición de un usuario específico en el leaderboard
   */
  async getUserPosition(req, res, next) {
    try {
      const { id } = req.params;
      const { zone } = req.query;

      const user = await supabaseService.getById("profiles", id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Generar leaderboard completo
      let users = await supabaseService.query("profiles", (query) => {
        let q = query
          .eq("preferences->>public_profile", "true")
          .order("points", { ascending: false });

        if (zone) {
          q = q.eq("zone", zone);
        }

        return q;
      });

      // Encontrar posición
      const position = users.findIndex((u) => u.id === id) + 1;

      if (position === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found in leaderboard (profile might be private)",
        });
      }

      res.json({
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
          totalPlayers: users.length,
          weeklyPoints: 0, // Calcular si es necesario
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/leaderboard/regenerate
   * Regenera el leaderboard (no es necesario con Supabase, solo retorna datos actuales)
   */
  async regenerate(req, res, next) {
    try {
      // En Supabase no necesitamos regenerar, solo devolvemos el leaderboard actual
      const users = await supabaseService.query("profiles", (query) =>
        query
          .eq("preferences->>public_profile", "true")
          .order("points", { ascending: false })
      );

      const leaderboard = users.map((user, index) => ({
        userId: user.id,
        name: user.name,
        avatar: user.avatar_url,
        points: user.points,
        zone: user.zone,
        level: user.level,
        streak: user.streak,
        badges: user.badges,
        position: index + 1,
        weeklyPoints: 0,
      }));

      res.json({
        success: true,
        message: "Leaderboard data retrieved successfully",
        count: leaderboard.length,
        data: leaderboard,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new LeaderboardController();
