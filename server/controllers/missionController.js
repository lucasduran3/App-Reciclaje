/**
 * Mission Controller - Controlador de misiones con Supabase
 */

import supabaseService from "../services/supabaseService.js";
import { updateUserPoints } from "../services/pointsService.js";

class MissionController {
  /**
   * GET /api/missions
   * Obtiene todas las misiones con filtros opcionales
   */
  async getAll(req, res, next) {
    try {
      const { type, category, completed } = req.query;

      let missions = await supabaseService.query("missions", (query) => {
        let q = query.order("created_at", { ascending: false });

        if (type) q = q.eq("type", type);
        if (category) q = q.eq("category", category);

        return q;
      });

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
      const mission = await supabaseService.getById("missions", id);

      if (!mission) {
        return res.status(404).json({
          success: false,
          error: "Mision no encontrada",
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

      const mission = await supabaseService.getById("missions", id);
      if (!mission) {
        return res.status(404).json({
          success: false,
          error: "Mision no encontrada",
        });
      }

      const updatedMission = await supabaseService.update(
        "missions",
        id,
        updates
      );

      res.json({
        success: true,
        message: "Mision actualizada con exito",
        data: updatedMission,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/missions/:id/increment
   * Incrementa el progreso de una misión para un usuario
   */
  async incrementProgress(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, amount = 1 } = req.body;

      const mission = await supabaseService.getById("missions", id);
      if (!mission) {
        return res.status(404).json({
          success: false,
          error: "Mision no encontrada",
        });
      }

      // Buscar el progreso del usuario para esta misión
      const userMissions = await supabaseService.query(
        "user_missions",
        (query) => query.eq("user_id", userId).eq("mission_id", id).single()
      );

      let userMission = userMissions[0];

      if (!userMission) {
        // Crear nuevo registro de progreso
        userMission = await supabaseService.create("user_missions", {
          user_id: userId,
          mission_id: id,
          progress: 0,
          completed: false,
        });
      }

      if (userMission.completed) {
        return res.status(400).json({
          success: false,
          error: "La mision ya fue completada",
        });
      }

      // Incrementar progreso
      const newProgress = userMission.progress + amount;
      const updates = { progress: newProgress };

      // Si alcanza el goal, completar y dar puntos
      if (newProgress >= mission.goal) {
        updates.completed = true;
        updates.completed_at = new Date().toISOString();

        // Dar puntos al usuario
        if (userId) {
          await updateUserPoints(userId, mission.points, "missions_completed");
        }
      }

      const updatedUserMission = await supabaseService.update(
        "user_missions",
        userMission.id,
        updates
      );

      res.json({
        success: true,
        message: updates.completed
          ? "Mision completada!"
          : "Progreso actualizado",
        data: {
          mission,
          userProgress: updatedUserMission,
        },
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
      const { type } = req.body;

      if (!["daily", "weekly"].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Type must be "daily" or "weekly"',
        });
      }

      // Templates de misiones
      const dailyTemplates = [
        {
          title: "Reportar un punto sucio",
          description:
            "Encuentra y reporta un lugar que necesite limpieza en tu zona",
          icon: "fluent-color:megaphone-loud-32",
          type: "daily",
          category: "reporter",
          points: 50,
          goal: 1,
          requirements: { minPhotos: 1, mustHaveLocation: true },
        },
        {
          title: "Acepta un reto de limpieza",
          description: "Acepta al menos un ticket reportado por otro usuario",
          icon: "fluent-color:circle-multiple-hint-checkmark-48",
          type: "daily",
          category: "cleaner",
          points: 30,
          goal: 1,
          requirements: { mustBeOthersTicket: true },
        },
        {
          title: "Valida una limpieza",
          description: "Valida un ticket que hayas reportado y fue limpiado",
          icon: "fluent-color:checkmark-circle-48",
          type: "daily",
          category: "validator",
          points: 40,
          goal: 1,
          requirements: { mustBeOwnTicket: true, ticketStatus: "validating" },
        },
      ];

      const weeklyTemplates = [
        {
          title: "Limpiador Semanal",
          description: "Completa la limpieza de 5 tickets esta semana",
          icon: "fluent-emoji-flat:broom",
          type: "weekly",
          category: "cleaner",
          points: 300,
          goal: 5,
          requirements: { cleaningStatus: "complete" },
        },
        {
          title: "Explorador Urbano",
          description: "Reporta 10 puntos sucios en diferentes zonas",
          icon: "fluent-color:search-sparkle-48",
          type: "weekly",
          category: "reporter",
          points: 250,
          goal: 10,
          requirements: { uniqueZones: 3 },
        },
        {
          title: "Comunidad Activa",
          description: "Da 20 likes y comenta en 5 tickets de otros usuarios",
          icon: "fluent-color:comment-48",
          type: "weekly",
          category: "social",
          points: 100,
          goal: 25,
          requirements: { likes: 20, comments: 5 },
        },
      ];

      const templates = type === "daily" ? dailyTemplates : weeklyTemplates;

      // Calcular fecha de expiración
      const expiresAt = new Date();
      if (type === "daily") {
        expiresAt.setDate(expiresAt.getDate() + 1);
      } else {
        expiresAt.setDate(expiresAt.getDate() + 7);
      }
      expiresAt.setHours(3, 0, 0, 0);

      // Eliminar misiones viejas del mismo tipo
      const oldMissions = await supabaseService.query("missions", (query) =>
        query.eq("type", type)
      );

      for (const oldMission of oldMissions) {
        await supabaseService.delete("missions", oldMission.id);
      }

      // Crear nuevas misiones
      const newMissions = [];
      for (const template of templates) {
        const mission = await supabaseService.create("missions", {
          ...template,
          expires_at: expiresAt.toISOString(),
        });
        newMissions.push(mission);
      }

      res.json({
        success: true,
        message: `${type} misiones regeneradas con éxito`,
        data: newMissions,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MissionController();
