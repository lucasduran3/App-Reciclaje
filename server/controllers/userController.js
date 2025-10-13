/**
 * User Controller - Controlador de usuarios
 */

import fileService from '../services/fileService.js';
import { validateUser } from '../services/validationService.js';
import { calculateLevel } from '../services/pointsService.js';
import { updateStreak } from '../services/streakService.js';
import { generateId } from '../utils/idGenerator.js';

class UserController {
  /**
   * GET /api/users
   * Obtiene todos los usuarios
   */
  async getAll(req, res, next) {
    try {
      const users = fileService.getCollection('users');

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
      const user = fileService.findById('users', id);

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
   * POST /api/users
   * Crea un nuevo usuario
   */
  async create(req, res, next) {
    try {
      const userData = req.body;

      // Validar datos
      const validation = validateUser(userData);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors,
        });
      }

      // Verificar email único
      const users = fileService.getCollection('users');
      if (users.some(u => u.email === userData.email)) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists',
        });
      }

      // Crear usuario
      const newUser = {
        id: generateId('user'),
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
        points: 0,
        level: 1,
        streak: 0,
        lastActivityDate: new Date().toISOString().split('T')[0],
        zone: userData.zone,
        stats: {
          ticketsReported: 0,
          ticketsAccepted: 0,
          ticketsCleaned: 0,
          ticketsValidated: 0,
          missionsCompleted: 0,
          likesGiven: 0,
          likesReceived: 0,
          commentsGiven: 0,
          commentsReceived: 0,
        },
        badges: [],
        preferences: {
          notifications: true,
          publicProfile: true,
          theme: 'light',
        },
        createdAt: new Date().toISOString(),
      };

      await fileService.addToCollection('users', newUser);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser,
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

      const user = fileService.findById('users', id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Campos que se pueden actualizar
      const allowedUpdates = ['name', 'avatar', 'zone', 'preferences'];
      const updateData = {};

      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          updateData[key] = updates[key];
        }
      }

      // Recalcular nivel si hay cambio de puntos
      if (updates.points !== undefined) {
        updateData.points = updates.points;
        updateData.level = calculateLevel(updates.points);
      }

      const updatedUser = await fileService.updateInCollection('users', id, updateData);

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

      await fileService.deleteFromCollection('users', id);

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

      const user = fileService.findById('users', id);
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

      const updatedUser = await fileService.updateInCollection('users', id, {
        points: newPoints + streakResult.pointsAwarded,
        level: newLevel,
        streak: streakResult.streak,
        lastActivityDate: user.lastActivityDate,
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
      const user = fileService.findById('users', id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Obtener tickets del usuario
      const tickets = fileService.getCollection('tickets');
      const userTickets = {
        reported: tickets.filter(t => t.reportedBy === id),
        accepted: tickets.filter(t => t.acceptedBy === id),
        validated: tickets.filter(t => t.validatedBy === id),
      };

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            points: user.points,
            level: user.level,
            streak: user.streak,
            zone: user.zone,
          },
          stats: user.stats,
          badges: user.badges,
          tickets: {
            reported: userTickets.reported.length,
            accepted: userTickets.accepted.length,
            validated: userTickets.validated.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();