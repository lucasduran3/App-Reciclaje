/**
 * User Controller - Controlador de usuarios con Supabase
 */

import supabaseService from '../services/supabaseService.js';
import { calculateLevel } from '../services/pointsService.js';
import { updateStreak } from '../services/streakService.js';

class UserController {
  /**
   * GET /api/users
   * Obtiene todos los usuarios (perfiles públicos)
   */
  async getAll(req, res, next) {
    try {
      const users = await supabaseService.query('profiles', (query) => {
        return query
          .eq('preferences->>public_profile', 'true')
          .order('points', { ascending: false });
      });

      res.json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   * Obtiene un usuario por ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await supabaseService.getById('profiles', id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:id
   * Actualiza un usuario
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const user = await supabaseService.getById('profiles', id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Campos que se pueden actualizar
      const allowedUpdates = ['name', 'last_name', 'avatar_url', 'city', 'neighborhood', 'preferences'];
      const updateData = {};

      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          updateData[key] = updates[key];
        }
      }

      // Actualizar zona si cambian ciudad o barrio
      if (updates.city || updates.neighborhood) {
        updateData.zone = `${updates.city || user.city} - ${updates.neighborhood || user.neighborhood}`;
      }

      // Recalcular nivel si hay cambio de puntos
      if (updates.points !== undefined) {
        updateData.points = updates.points;
        updateData.level = calculateLevel(updates.points);
      }

      const updatedUser = await supabaseService.update('profiles', id, updateData);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id
   * Elimina un usuario
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // En Supabase, eliminar el perfil también eliminará el usuario de auth
      await supabaseService.delete('profiles', id);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/:id/add-points
   * Agrega puntos a un usuario
   */
  async addPoints(req, res, next) {
    try {
      const { id } = req.params;
      const { points, reason } = req.body;

      if (typeof points !== 'number' || points <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Points must be a positive number',
        });
      }

      const user = await supabaseService.getById('profiles', id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Actualizar puntos y nivel
      const newPoints = user.points + points;
      const newLevel = calculateLevel(newPoints);

      // Actualizar racha
      const streakResult = updateStreak(user);

      const updatedUser = await supabaseService.update('profiles', id, {
        points: newPoints + streakResult.pointsAwarded,
        level: newLevel,
        streak: streakResult.streak,
        last_activity_date: user.last_activity_date,
        badges: user.badges,
      });

      res.json({
        success: true,
        message: 'Points added successfully',
        data: {
          user: updatedUser,
          pointsAdded: points,
          streakBonus: streakResult.pointsAwarded,
          totalAdded: points + streakResult.pointsAwarded,
          newBadge: streakResult.badgeAwarded,
          reason,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id/stats
   * Obtiene estadísticas de un usuario
   */
  async getStats(req, res, next) {
    try {
      const { id } = req.params;
      const user = await supabaseService.getById('profiles', id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Obtener tickets del usuario
      const reportedTickets = await supabaseService.query('tickets', (query) => 
        query.eq('reported_by', id)
      );

      const acceptedTickets = await supabaseService.query('tickets', (query) => 
        query.eq('accepted_by', id)
      );

      const validatedTickets = await supabaseService.query('tickets', (query) => 
        query.eq('validated_by', id)
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            avatar_url: user.avatar_url,
            points: user.points,
            level: user.level,
            streak: user.streak,
            zone: user.zone,
          },
          stats: user.stats,
          badges: user.badges,
          tickets: {
            reported: reportedTickets.length,
            accepted: acceptedTickets.length,
            validated: validatedTickets.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();