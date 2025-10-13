/**
 * Leaderboard Controller - Controlador de rankings
 */

import fileService from '../services/fileService.js';

class LeaderboardController {
  /**
   * GET /api/leaderboard
   * Obtiene el leaderboard con filtros opcionales
   */
  async get(req, res, next) {
    try {
      const { zone, limit = 100 } = req.query;

      // Obtener usuarios
      const users = fileService.getCollection('users');

      // Filtrar solo perfiles públicos
      let leaderboard = users
        .filter(u => u.preferences.publicProfile)
        .map(user => ({
          userId: user.id,
          name: user.name,
          avatar: user.avatar,
          points: user.points,
          zone: user.zone,
          level: user.level,
          streak: user.streak,
          badges: user.badges,
          weeklyPoints: this.calculateWeeklyPoints(user.id),
        }))
        .sort((a, b) => b.points - a.points);

      // Filtrar por zona si se especifica
      if (zone) {
        leaderboard = leaderboard.filter(entry => entry.zone === zone);
      }

      // Agregar posición
      leaderboard = leaderboard.slice(0, parseInt(limit)).map((entry, index) => ({
        ...entry,
        position: index + 1,
      }));

      res.json({
        success: true,
        type: zone ? 'zone' : 'global',
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

      const user = fileService.findById('users', id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Generar leaderboard completo
      const users = fileService.getCollection('users');
      let leaderboard = users
        .filter(u => u.preferences.publicProfile)
        .sort((a, b) => b.points - a.points);

      // Filtrar por zona si se especifica
      if (zone) {
        leaderboard = leaderboard.filter(u => u.zone === zone);
      }

      // Encontrar posición
      const position = leaderboard.findIndex(u => u.id === id) + 1;

      if (position === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found in leaderboard (profile might be private)',
        });
      }

      res.json({
        success: true,
        data: {
          userId: user.id,
          name: user.name,
          avatar: user.avatar,
          points: user.points,
          zone: user.zone,
          level: user.level,
          streak: user.streak,
          position,
          totalPlayers: leaderboard.length,
          weeklyPoints: this.calculateWeeklyPoints(user.id),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/leaderboard/regenerate
   * Regenera el leaderboard (actualiza cache)
   */
  async regenerate(req, res, next) {
    try {
      const users = fileService.getCollection('users');

      const leaderboard = users
        .filter(u => u.preferences.publicProfile)
        .map(user => ({
          userId: user.id,
          name: user.name,
          avatar: user.avatar,
          points: user.points,
          zone: user.zone,
          level: user.level,
          streak: user.streak,
          badges: user.badges,
          weeklyPoints: this.calculateWeeklyPoints(user.id),
        }))
        .sort((a, b) => b.points - a.points)
        .map((entry, index) => ({
          ...entry,
          position: index + 1,
        }));

      // Guardar en colección
      await fileService.updateCollection('leaderboard', leaderboard);

      res.json({
        success: true,
        message: 'Leaderboard regenerated successfully',
        count: leaderboard.length,
        data: leaderboard,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calcula puntos ganados en la última semana
   * @private
   */
  calculateWeeklyPoints(userId) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const tickets = fileService.getCollection('tickets');
    
    let weeklyPoints = 0;

    tickets.forEach(ticket => {
      const completedDate = ticket.completedAt ? new Date(ticket.completedAt) : null;
      
      if (completedDate && completedDate >= oneWeekAgo) {
        if (ticket.pointsAwarded) {
          if (ticket.reportedBy === userId) {
            weeklyPoints += ticket.pointsAwarded.reporter;
          }
          if (ticket.acceptedBy === userId) {
            weeklyPoints += ticket.pointsAwarded.cleaner;
          }
          if (ticket.validatedBy === userId) {
            weeklyPoints += ticket.pointsAwarded.validator;
          }
        }
      }
    });

    return weeklyPoints;
  }
}

export default new LeaderboardController();