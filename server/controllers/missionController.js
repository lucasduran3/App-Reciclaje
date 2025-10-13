/**
 * Mission Controller - Controlador de misiones
 */

import fileService from '../services/fileService.js';
import { generateId } from '../utils/idGenerator.js';

class MissionController {
  /**
   * GET /api/missions
   * Obtiene todas las misiones con filtros opcionales
   */
  async getAll(req, res, next) {
    try {
      let missions = fileService.getCollection('missions');

      // Filtros
      const { type, category, completed } = req.query;

      if (type) {
        missions = missions.filter(m => m.type === type);
      }

      if (category) {
        missions = missions.filter(m => m.category === category);
      }

      if (completed !== undefined) {
        const isCompleted = completed === 'true';
        missions = missions.filter(m => m.completed === isCompleted);
      }

      res.json({
        success: true,
        count: missions.length,
        data: missions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/missions/:id
   * Obtiene una misión por ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const mission = fileService.findById('missions', id);

      if (!mission) {
        return res.status(404).json({
          success: false,
          error: 'Mission not found',
        });
      }

      res.json({
        success: true,
        data: mission,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/missions/:id
   * Actualiza una misión (principalmente para progreso)
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const mission = fileService.findById('missions', id);
      if (!mission) {
        return res.status(404).json({
          success: false,
          error: 'Mission not found',
        });
      }

      // Si se actualiza progreso y alcanza el goal, marcar como completada
      if (updates.progress !== undefined && updates.progress >= mission.goal) {
        updates.completed = true;
        updates.completedAt = new Date().toISOString();
      }

      const updatedMission = await fileService.updateInCollection('missions', id, updates);

      res.json({
        success: true,
        message: 'Mission updated successfully',
        data: updatedMission,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/missions/:id/increment
   * Incrementa el progreso de una misión
   */
  async incrementProgress(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, amount = 1 } = req.body;

      const mission = fileService.findById('missions', id);
      if (!mission) {
        return res.status(404).json({
          success: false,
          error: 'Mission not found',
        });
      }

      if (mission.completed) {
        return res.status(400).json({
          success: false,
          error: 'Mission is already completed',
        });
      }

      // Incrementar progreso
      const newProgress = mission.progress + amount;
      const updates = { progress: newProgress };

      // Si alcanza el goal, completar y dar puntos
      if (newProgress >= mission.goal) {
        updates.completed = true;
        updates.completedAt = new Date().toISOString();

        // Dar puntos al usuario
        if (userId) {
          const user = fileService.findById('users', userId);
          if (user) {
            user.stats.missionsCompleted++;
            await fileService.updateInCollection('users', userId, { stats: user.stats });

            const userController = (await import('./userController.js')).default;
            await userController.addPoints(
              { params: { id: userId }, body: { points: mission.points, reason: `Mission completed: ${mission.title}` } },
              { json: () => {} },
              () => {}
            );
          }
        }
      }

      const updatedMission = await fileService.updateInCollection('missions', id, updates);

      res.json({
        success: true,
        message: updates.completed ? 'Mission completed!' : 'Progress updated',
        data: updatedMission,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/missions/regenerate
   * Regenera misiones diarias/semanales
   */
  async regenerate(req, res, next) {
    try {
      const { type } = req.body; // 'daily' o 'weekly'

      if (!['daily', 'weekly'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Type must be "daily" or "weekly"',
        });
      }

      const missions = fileService.getCollection('missions');
      
      // Eliminar misiones del tipo especificado que no estén completadas
      const filteredMissions = missions.filter(m => 
        m.type !== type || m.completed
      );

      // Templates de misiones
      const dailyTemplates = [
        {
          title: 'Reportar un punto sucio',
          description: 'Encuentra y reporta un lugar que necesite limpieza en tu zona',
          icon: '📍',
          type: 'daily',
          category: 'reporter',
          points: 50,
          goal: 1,
          requirements: { minPhotos: 1, mustHaveLocation: true },
        },
        {
          title: 'Acepta un reto de limpieza',
          description: 'Acepta al menos un ticket reportado por otro usuario',
          icon: '✋',
          type: 'daily',
          category: 'cleaner',
          points: 30,
          goal: 1,
          requirements: { mustBeOthersTicket: true },
        },
        {
          title: 'Valida una limpieza',
          description: 'Valida un ticket que hayas reportado y fue limpiado',
          icon: '✅',
          type: 'daily',
          category: 'validator',
          points: 40,
          goal: 1,
          requirements: { mustBeOwnTicket: true, ticketStatus: 'validating' },
        },
      ];

      const weeklyTemplates = [
        {
          title: 'Limpiador Semanal',
          description: 'Completa la limpieza de 5 tickets esta semana',
          icon: '🧹',
          type: 'weekly',
          category: 'cleaner',
          points: 300,
          goal: 5,
          requirements: { cleaningStatus: 'complete' },
        },
        {
          title: 'Explorador Urbano',
          description: 'Reporta 10 puntos sucios en diferentes zonas',
          icon: '🔍',
          type: 'weekly',
          category: 'reporter',
          points: 250,
          goal: 10,
          requirements: { uniqueZones: 3 },
        },
        {
          title: 'Comunidad Activa',
          description: 'Da 20 likes y comenta en 5 tickets de otros usuarios',
          icon: '💬',
          type: 'weekly',
          category: 'social',
          points: 100,
          goal: 25,
          requirements: { likes: 20, comments: 5 },
        },
      ];

      const templates = type === 'daily' ? dailyTemplates : weeklyTemplates;

      // Calcular fecha de expiración
      const expiresAt = new Date();
      if (type === 'daily') {
        expiresAt.setDate(expiresAt.getDate() + 1);
      } else {
        expiresAt.setDate(expiresAt.getDate() + 7);
      }
      expiresAt.setHours(3, 0, 0, 0);

      // Crear nuevas misiones
      const newMissions = templates.map(template => ({
        ...template,
        id: generateId('mission'),
        progress: 0,
        completed: false,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
      }));

      // Agregar nuevas misiones
      const allMissions = [...filteredMissions, ...newMissions];
      await fileService.updateCollection('missions', allMissions);

      res.json({
        success: true,
        message: `${type} missions regenerated successfully`,
        data: newMissions,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MissionController();