/**
 * Ticket Controller - Controlador de tickets con Supabase (Parte 1)
 */

import supabaseService from "../services/supabaseService.js";
import {
  validateTicket,
  validateTicketStatusTransition,
} from "../services/validationService.js";
import { calculateTicketPoints } from "../services/pointsService.js";

class TicketController {
  /**
   * GET /api/tickets
   * Obtiene todos los tickets con filtros opcionales
   */
  async getAll(req, res, next) {
    try {
      const { status, zone, type, reportedBy, acceptedBy } = req.query;

      let tickets = await supabaseService.query("tickets", (query) => {
        let q = query.order("created_at", { ascending: false });

        if (status) q = q.eq("status", status);
        if (zone) q = q.eq("zone", zone);
        if (type) q = q.eq("type", type);
        if (reportedBy) q = q.eq("reported_by", reportedBy);
        if (acceptedBy) q = q.eq("accepted_by", acceptedBy);

        return q;
      });

      res.json({
        success: true,
        count: tickets.length,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tickets/:id
   * Obtiene un ticket por ID e incrementa vistas
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const ticket = await supabaseService.getById("tickets", id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket not found",
        });
      }

      // Incrementar vistas
      const interactions = ticket.interactions || {
        likes: 0,
        views: 0,
        comments: 0,
        liked_by: [],
      };
      interactions.views = (interactions.views || 0) + 1;

      await supabaseService.update("tickets", id, { interactions });

      // Devolver ticket con vistas actualizadas
      ticket.interactions = interactions;

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tickets
   * Crea un nuevo ticket (reportar)
   */
  async create(req, res, next) {
    try {
      const ticketData = req.body;

      // Validar datos básicos
      if (!ticketData.title || ticketData.title.length < 10) {
        return res.status(400).json({
          success: false,
          error: "Title must be at least 10 characters",
        });
      }

      if (!ticketData.description || ticketData.description.length < 20) {
        return res.status(400).json({
          success: false,
          error: "Description must be at least 20 characters",
        });
      }

      // Verificar que el usuario existe
      const user = await supabaseService.getById(
        "profiles",
        ticketData.reported_by
      );
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Reporter user not found",
        });
      }

      // Crear ticket
      const newTicket = {
        title: ticketData.title,
        description: ticketData.description,
        location: `(${ticketData.location.lat},${ticketData.location.lng})`, // PostGIS point format
        address: ticketData.address,
        zone: ticketData.zone,
        type: ticketData.type,
        priority: ticketData.priority || "medium",
        estimated_size: ticketData.estimated_size || "medium",
        status: "reported",
        reported_by: ticketData.reported_by,
        photos_before: ticketData.photos_before,
        interactions: {
          likes: 0,
          comments: 0,
          views: 0,
          liked_by: [],
        },
      };

      const createdTicket = await supabaseService.create("tickets", newTicket);

      // Actualizar stats del usuario
      const stats = user.stats || {};
      stats.tickets_reported = (stats.tickets_reported || 0) + 1;

      await supabaseService.update("profiles", user.id, { stats });

      // Dar puntos al reportante
      const userController = (await import("./userController.js")).default;
      await userController.addPoints(
        {
          params: { id: user.id },
          body: { points: 50, reason: "Ticket reported" },
        },
        { json: () => {} },
        () => {}
      );

      res.status(201).json({
        success: true,
        message: "Ticket created successfully",
        data: createdTicket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/tickets/:id
   * Actualiza un ticket
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const ticket = await supabaseService.getById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket not found",
        });
      }

      // Validar transición de estado si se actualiza
      if (updates.status && updates.status !== ticket.status) {
        const statusValidation = validateTicketStatusTransition(
          ticket.status,
          updates.status
        );
        if (!statusValidation.valid) {
          return res.status(400).json({
            success: false,
            error: statusValidation.error,
          });
        }
      }

      const updatedTicket = await supabaseService.update(
        "tickets",
        id,
        updates
      );

      res.json({
        success: true,
        message: "Ticket updated successfully",
        data: updatedTicket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/tickets/:id
   * Elimina un ticket
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await supabaseService.delete("tickets", id);

      res.json({
        success: true,
        message: "Ticket deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tickets/:id/accept
   * Acepta un ticket para limpiar
   */

  async accept(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const ticket = await supabaseService.getById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket not found",
        });
      }

      if (ticket.status !== "reported") {
        return res.status(400).json({
          success: false,
          error: "Ticket is not available to accept",
        });
      }

      if (ticket.reported_by === userId) {
        return res.status(400).json({
          success: false,
          error: "Cannot accept your own ticket",
        });
      }

      const user = await supabaseService.getById("profiles", userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Actualizar ticket
      const updatedTicket = await supabaseService.update("tickets", id, {
        status: "accepted",
        accepted_by: userId,
        accepted_at: new Date().toISOString(),
      });

      // Actualizar stats del usuario
      const stats = user.stats || {};
      stats.tickets_accepted = (stats.tickets_accepted || 0) + 1;
      await supabaseService.update("profiles", userId, { stats });

      // Dar puntos
      const userController = (await import("./userController.js")).default;
      await userController.addPoints(
        {
          params: { id: userId },
          body: { points: 20, reason: "Ticket accepted" },
        },
        { json: () => {} },
        () => {}
      );

      res.json({
        success: true,
        message: "Ticket accepted successfully",
        data: updatedTicket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tickets/:id/complete
   * Marca un ticket como completado (limpieza terminada)
   */
  async complete(req, res, next) {
    try {
      const { id } = req.params;
      const { photos_after, cleaning_status, validation_type, qr_code } =
        req.body;

      const ticket = await supabaseService.getById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket not found",
        });
      }

      if (ticket.status !== "accepted" && ticket.status !== "in_progress") {
        return res.status(400).json({
          success: false,
          error: "Ticket cannot be completed in current status",
        });
      }

      if (!photos_after || photos_after.length === 0) {
        return res.status(400).json({
          success: false,
          error: "At least one after photo is required",
        });
      }

      // Actualizar ticket
      const updatedTicket = await supabaseService.update("tickets", id, {
        status: "validating",
        photos_after: photos_after,
        cleaning_status: cleaning_status || "complete",
        validation_type: validation_type || "photo",
        validation_status: "pending",
        qr_code: qr_code || null,
      });

      res.json({
        success: true,
        message: "Ticket marked as completed, waiting for validation",
        data: updatedTicket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tickets/:id/validate
   * Valida un ticket completado
   */
  async validate(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, approved, rejectionReason } = req.body;

      const ticket = await supabaseService.getById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket not found",
        });
      }

      if (ticket.status !== "validating") {
        return res.status(400).json({
          success: false,
          error: "Ticket is not waiting for validation",
        });
      }

      // Si es validación por reportante, verificar que sea el mismo
      if (
        ticket.validation_type === "reporter" &&
        ticket.reported_by !== userId
      ) {
        return res.status(403).json({
          success: false,
          error: "Only the reporter can validate this ticket",
        });
      }

      const user = await supabaseService.getById("profiles", userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      if (approved) {
        // Validación aprobada - completar ticket
        const points = calculateTicketPoints(ticket);

        const updatedTicket = await supabaseService.update("tickets", id, {
          status: "completed",
          validated_by: userId,
          validation_status: "approved",
          validated_at: new Date().toISOString(),
          points_awarded: points,
          completed_at: new Date().toISOString(),
        });

        // Actualizar stats y dar puntos a todos los participantes
        const userController = (await import("./userController.js")).default;

        // Limpiador
        if (ticket.accepted_by) {
          const cleaner = await supabaseService.getById(
            "profiles",
            ticket.accepted_by
          );
          const cleanerStats = cleaner.stats || {};
          cleanerStats.tickets_cleaned =
            (cleanerStats.tickets_cleaned || 0) + 1;

          await supabaseService.update("profiles", ticket.accepted_by, {
            stats: cleanerStats,
          });

          await userController.addPoints(
            {
              params: { id: ticket.accepted_by },
              body: { points: points.cleaner, reason: "Cleaning completed" },
            },
            { json: () => {} },
            () => {}
          );
        }

        // Validador
        const validatorStats = user.stats || {};
        validatorStats.tickets_validated =
          (validatorStats.tickets_validated || 0) + 1;

        await supabaseService.update("profiles", userId, {
          stats: validatorStats,
        });

        await userController.addPoints(
          {
            params: { id: userId },
            body: { points: points.validator, reason: "Validation completed" },
          },
          { json: () => {} },
          () => {}
        );

        res.json({
          success: true,
          message: "Ticket validated and completed successfully",
          data: {
            ticket: updatedTicket,
            pointsAwarded: points,
          },
        });
      } else {
        // Validación rechazada
        const updatedTicket = await supabaseService.update("tickets", id, {
          status: "rejected",
          validation_status: "rejected",
          validated_at: new Date().toISOString(),
          rejection_reason: rejectionReason || "Validation rejected",
        });

        res.json({
          success: true,
          message: "Validation rejected, ticket can be reattempted",
          data: updatedTicket,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tickets/:id/like
   * Da like a un ticket
   */
  async like(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const ticket = await supabaseService.getById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket not found",
        });
      }

      const user = await supabaseService.getById("profiles", userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Obtener interacciones actuales
      const interactions = ticket.interactions || {
        likes: 0,
        views: 0,
        comments: 0,
        liked_by: [],
      };
      const likedBy = interactions.liked_by || [];

      // Verificar si ya dio like
      if (likedBy.includes(userId)) {
        // Quitar like
        interactions.liked_by = likedBy.filter((id) => id !== userId);
        interactions.likes = Math.max(0, (interactions.likes || 0) - 1);
      } else {
        // Agregar like
        interactions.liked_by = [...likedBy, userId];
        interactions.likes = (interactions.likes || 0) + 1;

        // Dar puntos al dueño del ticket
        const reporter = await supabaseService.getById(
          "profiles",
          ticket.reported_by
        );
        if (reporter) {
          const reporterStats = reporter.stats || {};
          reporterStats.likes_received =
            (reporterStats.likes_received || 0) + 1;

          await supabaseService.update("profiles", ticket.reported_by, {
            stats: reporterStats,
            points: reporter.points + 5,
          });
        }

        // Actualizar stats del usuario que dio like
        const userStats = user.stats || {};
        userStats.likes_given = (userStats.likes_given || 0) + 1;
        await supabaseService.update("profiles", userId, { stats: userStats });
      }

      const updatedTicket = await supabaseService.update("tickets", id, {
        interactions,
      });

      res.json({
        success: true,
        message: interactions.liked_by.includes(userId)
          ? "Like added"
          : "Like removed",
        data: updatedTicket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tickets/:id/comments
   * Añade un comentario a un ticket
   */
  async addComment(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, text } = req.body;

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Comment text is required and cannot be empty",
        });
      }

      if (text.trim().length > 500) {
        return res.status(400).json({
          success: false,
          error: "Comment text cannot exceed 500 characters",
        });
      }

      const ticket = await supabaseService.getById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket not found",
        });
      }

      const user = await supabaseService.getById("profiles", userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const sanitizedText = text
        .trim()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

      const newComment = {
        ticket_id: id,
        user_id: userId,
        content: sanitizedText,
      };

      const createdComment = await supabaseService.create(
        "comments",
        newComment
      );

      // Actualizar contador de comentarios en ticket
      const interactions = ticket.interactions || {
        likes: 0,
        views: 0,
        comments: 0,
        liked_by: [],
      };
      interactions.comments = (interactions.comments || 0) + 1;

      await supabaseService.update("tickets", id, { interactions });

      // Actualizar stats del usuario
      const userStats = user.stats || {};
      userStats.comments_given = (userStats.comments_given || 0) + 1;
      await supabaseService.update("profiles", userId, { stats: userStats });

      res.status(201).json({
        success: true,
        message: "Comment added successfully",
        data: createdComment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tickets
   * Crea un nuevo ticket con upload de imagen a Supabase Storage
   */
  async create(req, res, next) {
    try {
      // Obtener userId del token (implementar middleware de auth)
      const userId = req.user?.id || req.body.reported_by;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
        });
      }

      const ticketData = req.body;

      // Validaciones básicas
      const validationErrors = [];

      // Title
      if (
        !ticketData.title ||
        ticketData.title.length < 5 ||
        ticketData.title.length > 120
      ) {
        validationErrors.push("El título debe tener entre 5 y 120 caracteres");
      }

      // Description
      if (
        !ticketData.description ||
        ticketData.description.length < 10 ||
        ticketData.description.length > 2000
      ) {
        validationErrors.push(
          "La descripción debe tener entre 10 y 2000 caracteres"
        );
      }

      // Zone
      const validZones = ["Centro", "Norte", "Sur", "Este", "Oeste"];
      if (!ticketData.zone || !validZones.includes(ticketData.zone)) {
        validationErrors.push("Zona inválida");
      }

      // Type
      const validTypes = [
        "general",
        "recyclable",
        "organic",
        "electronic",
        "hazardous",
        "bulky",
      ];
      if (!ticketData.type || !validTypes.includes(ticketData.type)) {
        validationErrors.push("Tipo de residuo inválido");
      }

      // Priority
      const validPriorities = ["low", "medium", "high", "urgent"];
      if (
        !ticketData.priority ||
        !validPriorities.includes(ticketData.priority)
      ) {
        validationErrors.push("Prioridad inválida");
      }

      // Estimated Size
      const validSizes = ["small", "medium", "large", "xlarge"];
      if (
        !ticketData.estimated_size ||
        !validSizes.includes(ticketData.estimated_size)
      ) {
        validationErrors.push("Tamaño estimado inválido");
      }

      // Location
      if (
        !ticketData.location ||
        !ticketData.location.lat ||
        !ticketData.location.lng
      ) {
        validationErrors.push("Ubicación es requerida (coordenadas)");
      } else {
        const lat = parseFloat(ticketData.location.lat);
        const lng = parseFloat(ticketData.location.lng);

        if (
          isNaN(lat) ||
          isNaN(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180
        ) {
          validationErrors.push("Coordenadas inválidas");
        }
      }

      // Address
      if (!ticketData.address || ticketData.address.trim().length < 5) {
        validationErrors.push("Dirección es requerida (mínimo 5 caracteres)");
      }

      // Photo validation (debe venir como base64 o URL ya subida)
      if (!ticketData.photo_before) {
        validationErrors.push('Foto "antes" es requerida');
      }

      // Si hay errores, retornar
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          errors: validationErrors,
        });
      }

      // Verificar que el usuario existe
      const user = await supabaseService.getById("profiles", userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      // Subir foto a Supabase Storage
      let photoUrl;

      if (ticketData.photo_before.startsWith("data:")) {
        // Es base64, necesitamos subirla
        photoUrl = await this.uploadPhotoToStorage(
          ticketData.photo_before,
          userId
        );
      } else if (ticketData.photo_before.startsWith("http")) {
        // Ya es una URL (foto ya subida)
        photoUrl = ticketData.photo_before;
      } else {
        return res.status(400).json({
          success: false,
          error: "Formato de foto inválido",
        });
      }

      // Crear ticket en la base de datos
      const newTicket = {
        title: ticketData.title.trim(),
        description: ticketData.description.trim(),
        location: `(${ticketData.location.lat},${ticketData.location.lng})`, // PostGIS point
        address: ticketData.address.trim(),
        zone: ticketData.zone,
        type: ticketData.type,
        priority: ticketData.priority,
        estimated_size: ticketData.estimated_size,
        status: "reported",
        reported_by: userId,
        photos_before: [photoUrl], // Array de URLs
        interactions: {
          likes: 0,
          comments: 0,
          views: 0,
          liked_by: [],
        },
      };

      const createdTicket = await supabaseService.create("tickets", newTicket);

      // Actualizar stats del usuario
      const stats = user.stats || {};
      stats.tickets_reported = (stats.tickets_reported || 0) + 1;
      await supabaseService.update("profiles", userId, { stats });

      // Dar puntos al reportante (50 puntos)
      await supabaseService.update("profiles", userId, {
        points: user.points + 50,
      });

      res.status(201).json({
        success: true,
        message: "Ticket creado exitosamente",
        data: createdTicket,
      });
    } catch (error) {
      console.error("Error creating ticket:", error);
      next(error);
    }
  }

  /**
   * Sube una foto a Supabase Storage
   * @param {string} base64Data - Imagen en base64
   * @param {string} userId - ID del usuario
   * @returns {Promise<string>} URL pública de la imagen
   */
  async uploadPhotoToStorage(base64Data, userId) {
    try {
      // Extraer el tipo de imagen y los datos
      const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);

      if (!matches || matches.length !== 3) {
        throw new Error("Formato de imagen base64 inválido");
      }

      const imageType = matches[1]; // jpeg, png, webp
      const base64Content = matches[2];

      // Validar tipo de imagen
      const validTypes = ["jpeg", "jpg", "png", "webp"];
      if (!validTypes.includes(imageType.toLowerCase())) {
        throw new Error("Tipo de imagen no permitido. Usa JPG, PNG o WebP");
      }

      // Convertir base64 a Buffer
      const imageBuffer = Buffer.from(base64Content, "base64");

      // Validar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageBuffer.length > maxSize) {
        throw new Error("La imagen excede el tamaño máximo de 5MB");
      }

      // Generar nombre único para la imagen
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const fileName = `${userId}/${timestamp}-${randomStr}.${imageType}`;

      // Subir a Supabase Storage (bucket: ticket-photos)
      const { data, error } = await supabase.storage
        .from("ticket-photos")
        .upload(fileName, imageBuffer, {
          contentType: `image/${imageType}`,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading to storage:", error);
        throw new Error(`Error al subir imagen: ${error.message}`);
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from("ticket-photos")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error in uploadPhotoToStorage:", error);
      throw error;
    }
  }
}

export default new TicketController();
