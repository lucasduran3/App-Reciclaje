import supabaseService from "../services/supabaseService.js";
import { validateTicketStatusTransition } from "../services/validationService.js";
import {
  calculateAcceptPoints,
  calculateCleaningPoints,
  calculateTicketPoints,
} from "../services/pointsService.js";
import {
  updateUserPoints,
  calculateReportPoints,
} from "../services/pointsService.js";
import { validationResult } from "express-validator";

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
   * Crea un nuevo ticket con upload de imagen a Supabase Storage
   */
  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Obtener userId del token (implementar middleware de auth)
      const userId = req.user?.id || req.body.reported_by;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
        });
      }

      const ticketData = req.body;

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
        photoUrl = await supabaseService.uploadPhotoToStorage(
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

      // Dar puntos al reportante
      await updateUserPoints(
        userId,
        calculateReportPoints(),
        "tickets_reported"
      );

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
          error: "Ticket no encontrado",
        });
      }

      if (ticket.status !== "reported") {
        return res.status(400).json({
          success: false,
          error: "El ticket no se puede aceptar",
        });
      }

      if (ticket.reported_by === userId) {
        return res.status(400).json({
          success: false,
          error: "No puedes aceptar tu propio ticket",
        });
      }

      const user = await supabaseService.getById("profiles", userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      // Actualizar ticket
      const updatedTicket = await supabaseService.update("tickets", id, {
        status: "accepted",
        accepted_by: userId,
        accepted_at: new Date().toISOString(),
      });

      // Dar puntos
      await updateUserPoints(
        userId,
        calculateAcceptPoints(),
        "tickets_accepted"
      );

      res.json({
        success: true,
        message: "Ticket aceptado con éxito",
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
      const { photo_after, cleaning_status } = req.body;

      // Obtener userId del token (viene del middleware de auth)
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
        });
      }

      // Validaciones básicas
      if (!photo_after) {
        return res.status(400).json({
          success: false,
          error: 'Foto "después" es requerida',
        });
      }

      if (
        !cleaning_status ||
        !["partial", "complete"].includes(cleaning_status)
      ) {
        return res.status(400).json({
          success: false,
          error: "Estado de limpieza inválido (partial o complete)",
        });
      }

      // Obtener ticket
      const ticket = await supabaseService.getById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket no encontrado",
        });
      }

      // Regla de negocio 1: Solo el cleaner puede completar
      if (ticket.accepted_by !== userId) {
        return res.status(403).json({
          success: false,
          error: "Solo el usuario que aceptó el ticket puede completarlo",
        });
      }

      // Regla de negocio 2: El reporter no puede completar su propio ticket
      if (ticket.reported_by === userId) {
        return res.status(403).json({
          success: false,
          error: "No puedes completar tu propio ticket",
        });
      }

      // Regla de negocio 3: El ticket debe estar en estado permitido
      if (ticket.status !== "accepted" && ticket.status !== "in_progress") {
        return res.status(400).json({
          success: false,
          error: `Ticket no puede ser completado en estado "${ticket.status}"`,
        });
      }

      // Subir foto a Supabase Storage
      let photoUrl;
      if (photo_after.startsWith("data:")) {
        photoUrl = await supabaseService.uploadPhotoToStorage(
          photo_after,
          userId
        );
      } else if (photo_after.startsWith("http")) {
        photoUrl = photo_after;
      } else {
        return res.status(400).json({
          success: false,
          error: "Formato de foto inválido",
        });
      }

      // Actualizar ticket
      const updatedTicket = await supabaseService.update("tickets", id, {
        status: "validating",
        photos_after: [photoUrl],
        cleaning_status: cleaning_status,
        validation_type: "photo",
        validation_status: "pending",
      });

      const updatedUser = await updateUserPoints(
        userId,
        calculateCleaningPoints(updatedTicket),
        "tickets_cleaned"
      );

      res.json({
        success: true,
        message: "Ticket completado exitosamente. En espera de validación",
        data: {
          ticket: updatedTicket,
          pointsAwarded: updatedUser.points || 0,
        },
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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { approved, validation_message } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      const ticket = await supabaseService.getById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket no encontrado",
        });
      }

      // Validaciones de estado de ticket
      if (ticket.reported_by !== userId) {
        return res.status(403).json({
          succes: false,
          error: "Solo el reportante puede validar este ticket",
        });
      }

      if (ticket.status !== "validating") {
        return res.status(400).json({
          success: false,
          error: "El ticket no esta esperando validación",
        });
      }

      const points = calculateTicketPoints(ticket);

      if (approved) {
        // Validación aprobada - completar ticket
        const updatedTicket = await supabaseService.update("tickets", id, {
          status: "completed",
          validated_by: userId,
          validation_status: "approved",
          validated_at: new Date().toISOString(),
          validation_message: validation_message || null,
          points_awarded: points,
          completed_at: new Date().toISOString(),
        });

        // Actualizar stats y dar puntos a todos los participantes
        // Limpiador
        await updateUserPoints(ticket.accepted_by, points.cleaner);

        //actualizar stats del validador
        await updateUserPoints(userId, points.validator, "tickets_validated");

        res.json({
          success: true,
          message: "Ticket validado y completado con éxito",
          data: {
            ticket: updatedTicket,
            pointsAwarded: points,
          },
        });
      } else {
        //Validacion rechazada
        //eliminar foto del despues de supabase storage
        if (ticket.photos_after && ticket.photos_after.length > 0) {
          try {
            await supabaseService.deletePhotosFromStorage(ticket.photos_after);
          } catch (deleteError) {
            console.error("Error al eliminar fotos: ", deleteError);
            //No bloquear la validacion si falla el borrado
          }
        }

        //Actualizar stats del limpiador
        await updateUserPoints(ticket.accepted_by, -points.cleaner);

        //Actualizar stats del validador
        await updateUserPoints(userId, points.validator, "tickets_validated");

        //actualizar ticket a estado rerpoted
        const updatedTicket = await supabaseService.update("tickets", id, {
          status: "reported",
          validation_status: "rejected",
          validated_by: userId,
          validated_at: new Date().toISOString(),
          validation_message: validation_message || "Limpieza rechazada",
          photos_after: [],
          accepted_by: null,
          accepted_at: null,
          cleaning_status: null,
        });

        res.json({
          succes: true,
          message: "Validacion rechazada. El ticket vuelve a estar disponible",
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
          error: "Ticket no encontrado",
        });
      }

      const user = await supabaseService.getById("profiles", userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { userId, text } = req.body;

      const ticket = await supabaseService.getById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket no encontrado",
        });
      }

      const user = await supabaseService.getById("profiles", userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
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

      res.status(201).json({
        success: true,
        message: "Comentario añadido con éxito",
        data: createdComment,
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
          error: "Ticket no encontrado",
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
        message: "Ticket actualizado con éxito",
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
        message: "Ticket eliminado con éxito",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TicketController();
