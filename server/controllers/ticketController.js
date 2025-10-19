/**
 * Ticket Controller - Controlador de tickets
 */

import fileService from "../services/fileService.js";
import {
  validateTicket,
  validateTicketStatusTransition,
} from "../services/validationService.js";
import { calculateTicketPoints } from "../services/pointsService.js";
import { generateId } from "../utils/idGenerator.js";

class TicketController {
  /**
   * GET /api/tickets
   * Obtiene todos los tickets con filtros opcionales
   */
  async getAll(req, res, next) {
    try {
      let tickets = fileService.getCollection("tickets");

      // Filtros
      const { status, zone, type, reportedBy, acceptedBy } = req.query;

      if (status) {
        tickets = tickets.filter((t) => t.status === status);
      }

      if (zone) {
        tickets = tickets.filter((t) => t.zone === zone);
      }

      if (type) {
        tickets = tickets.filter((t) => t.type === type);
      }

      if (reportedBy) {
        tickets = tickets.filter((t) => t.reportedBy === reportedBy);
      }

      if (acceptedBy) {
        tickets = tickets.filter((t) => t.acceptedBy === acceptedBy);
      }

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
   * Obtiene un ticket por ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const ticket = fileService.findById("tickets", id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket not found",
        });
      }

      // Incrementar vistas
      ticket.interactions.views++;
      await fileService.updateInCollection("tickets", id, {
        interactions: ticket.interactions,
      });

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

      // Validar datos
      const validation = validateTicket(ticketData);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors,
        });
      }

      // Verificar que el usuario existe
      const user = fileService.findById("users", ticketData.reportedBy);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Reporter user not found",
        });
      }

      // Crear ticket
      const newTicket = {
        id: generateId("ticket"),
        title: ticketData.title,
        description: ticketData.description,
        location: ticketData.location,
        zone: ticketData.zone,
        type: ticketData.type,
        priority: ticketData.priority || "medium",
        estimatedSize: ticketData.estimatedSize || "medium",
        status: "reported",
        reportedBy: ticketData.reportedBy,
        acceptedBy: null,
        validatedBy: null,
        photos: {
          before: ticketData.photos.before,
          after: [],
        },
        validation: {
          type: null,
          status: null,
          qrCode: null,
          validatedAt: null,
        },
        cleaningStatus: null,
        pointsAwarded: null,
        interactions: {
          likes: 0,
          comments: 0,
          views: 0,
          likedBy: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        acceptedAt: null,
        completedAt: null,
      };

      await fileService.addToCollection("tickets", newTicket);

      // Actualizar stats del usuario
      user.stats.ticketsReported++;
      await fileService.updateInCollection("users", user.id, {
        stats: user.stats,
      });

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
        data: newTicket,
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

      const ticket = fileService.findById("tickets", id);
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

      const updatedTicket = await fileService.updateInCollection(
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

      await fileService.deleteFromCollection("tickets", id);

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

      const ticket = fileService.findById("tickets", id);
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

      if (ticket.reportedBy === userId) {
        return res.status(400).json({
          success: false,
          error: "Cannot accept your own ticket",
        });
      }

      const user = fileService.findById("users", userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Actualizar ticket
      const updatedTicket = await fileService.updateInCollection(
        "tickets",
        id,
        {
          status: "accepted",
          acceptedBy: userId,
          acceptedAt: new Date().toISOString(),
        }
      );

      // Actualizar stats del usuario
      user.stats.ticketsAccepted++;
      await fileService.updateInCollection("users", userId, {
        stats: user.stats,
      });

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
      const { photosAfter, cleaningStatus, validationType, qrCode } = req.body;

      const ticket = fileService.findById("tickets", id);
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

      if (!photosAfter || photosAfter.length === 0) {
        return res.status(400).json({
          success: false,
          error: "At least one after photo is required",
        });
      }

      // Actualizar ticket
      const updatedTicket = await fileService.updateInCollection(
        "tickets",
        id,
        {
          status: "validating",
          photos: {
            ...ticket.photos,
            after: photosAfter,
          },
          cleaningStatus: cleaningStatus || "complete",
          validation: {
            type: validationType || "photo",
            status: "pending",
            qrCode: qrCode || null,
            validatedAt: null,
          },
        }
      );

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

      const ticket = fileService.findById("tickets", id);
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
        ticket.validation.type === "reporter" &&
        ticket.reportedBy !== userId
      ) {
        return res.status(403).json({
          success: false,
          error: "Only the reporter can validate this ticket",
        });
      }

      const user = fileService.findById("users", userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      if (approved) {
        // Validación aprobada - completar ticket
        const points = calculateTicketPoints(ticket);

        const updatedTicket = await fileService.updateInCollection(
          "tickets",
          id,
          {
            status: "completed",
            validatedBy: userId,
            validation: {
              ...ticket.validation,
              status: "approved",
              validatedAt: new Date().toISOString(),
            },
            pointsAwarded: points,
            completedAt: new Date().toISOString(),
          }
        );

        // Actualizar stats y dar puntos a todos los participantes
        const userController = (await import("./userController.js")).default;

        // Limpiador
        if (ticket.acceptedBy) {
          const cleaner = fileService.findById("users", ticket.acceptedBy);
          cleaner.stats.ticketsCleaned++;
          await fileService.updateInCollection("users", ticket.acceptedBy, {
            stats: cleaner.stats,
          });
          await userController.addPoints(
            {
              params: { id: ticket.acceptedBy },
              body: { points: points.cleaner, reason: "Cleaning completed" },
            },
            { json: () => {} },
            () => {}
          );
        }

        // Validador
        user.stats.ticketsValidated++;
        await fileService.updateInCollection("users", userId, {
          stats: user.stats,
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
        const updatedTicket = await fileService.updateInCollection(
          "tickets",
          id,
          {
            status: "rejected",
            validation: {
              ...ticket.validation,
              status: "rejected",
              validatedAt: new Date().toISOString(),
              rejectionReason: rejectionReason || "Validation rejected",
            },
          }
        );

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

      const ticket = fileService.findById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket not found",
        });
      }

      const user = fileService.findById("users", userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Verificar si ya dio like
      if (ticket.interactions.likedBy.includes(userId)) {
        // Quitar like
        ticket.interactions.likedBy = ticket.interactions.likedBy.filter(
          (id) => id !== userId
        );
        ticket.interactions.likes--;
      } else {
        // Agregar like
        ticket.interactions.likedBy.push(userId);
        ticket.interactions.likes++;

        // Dar puntos al dueño del ticket
        const reporter = fileService.findById("users", ticket.reportedBy);
        if (reporter) {
          reporter.stats.likesReceived++;
          await fileService.updateInCollection("users", ticket.reportedBy, {
            stats: reporter.stats,
            points: reporter.points + 5,
          });
        }

        // Actualizar stats del usuario que dio like
        user.stats.likesGiven++;
        await fileService.updateInCollection("users", userId, {
          stats: user.stats,
        });
      }

      const updatedTicket = await fileService.updateInCollection(
        "tickets",
        id,
        {
          interactions: ticket.interactions,
        }
      );

      res.json({
        success: true,
        message: ticket.interactions.likedBy.includes(userId)
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

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
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

      const ticket = fileService.findById("tickets", id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket not found",
        });
      }

      const user = fileService.findById("users", userId);
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
        .replace(/>/g, "&gt;")  // ✅ Corregido: era /</g
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

      const newComment = {
        id: `comment-${Date.now()}`,  // ✅ Corregido
        ticketId: id,
        userId: userId,
        userName: user.name,
        userAvatar: user.avatar,
        content: sanitizedText,
        likes: 0,
        likedBy: [],
        createdAt: new Date().toISOString(),
      };

      await fileService.addToCollection("comments", newComment);

      ticket.interactions.comments++;
      await fileService.updateInCollection("tickets", id, {
        interactions: ticket.interactions,
      });

      // Actualizar stats del usuario
      user.stats.commentsGiven++;
      await fileService.updateInCollection("users", userId, {
        stats: user.stats,
      });

      res.status(201).json({
        success: true,
        message: "Comment added successfully",
        data: newComment,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TicketController();