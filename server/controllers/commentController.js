/**
 * Comment Controller - Controlador de comentarios
 */

import fileService from '../services/fileService.js';
import { validateComment } from '../services/validationService.js';
import { generateId } from '../utils/idGenerator.js';

class CommentController {
  /**
   * GET /api/comments
   * Obtiene todos los comentarios con filtros opcionales
   */
  async getAll(req, res, next) {
    try {
      let comments = fileService.getCollection('comments');

      // Filtros
      const { ticketId, userId } = req.query;

      if (ticketId) {
        comments = comments.filter(c => c.ticketId === ticketId);
      }

      if (userId) {
        comments = comments.filter(c => c.userId === userId);
      }

      res.json({
        success: true,
        count: comments.length,
        data: comments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/comments/:id
   * Obtiene un comentario por ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const comment = fileService.findById('comments', id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
        });
      }

      res.json({
        success: true,
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/comments
   * Crea un nuevo comentario
   */
  async create(req, res, next) {
    try {
      const commentData = req.body;

      // Validar datos
      const validation = validateComment(commentData);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors,
        });
      }

      // Verificar que ticket y usuario existen
      const ticket = fileService.findById('tickets', commentData.ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found',
        });
      }

      const user = fileService.findById('users', commentData.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Crear comentario
      const newComment = {
        id: generateId('comment'),
        ticketId: commentData.ticketId,
        userId: commentData.userId,
        userName: user.name,
        userAvatar: user.avatar,
        content: commentData.content.trim(),
        likes: 0,
        likedBy: [],
        createdAt: new Date().toISOString(),
      };

      await fileService.addToCollection('comments', newComment);

      // Actualizar contador de comentarios en ticket
      ticket.interactions.comments++;
      await fileService.updateInCollection('tickets', ticket.id, {
        interactions: ticket.interactions,
      });

      // Actualizar stats del usuario
      user.stats.commentsGiven++;
      await fileService.updateInCollection('users', user.id, { stats: user.stats });

      // Dar puntos al dueño del ticket
      const reporter = fileService.findById('users', ticket.reportedBy);
      if (reporter && reporter.id !== user.id) {
        reporter.stats.commentsReceived++;
        await fileService.updateInCollection('users', reporter.id, {
          stats: reporter.stats,
          points: reporter.points + 10,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: newComment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/comments/:id
   * Actualiza un comentario
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { content, userId } = req.body;

      const comment = fileService.findById('comments', id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
        });
      }

      // Verificar que el usuario es el autor
      if (comment.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only edit your own comments',
        });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Content cannot be empty',
        });
      }

      const updatedComment = await fileService.updateInCollection('comments', id, {
        content: content.trim(),
        updatedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: updatedComment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/comments/:id
   * Elimina un comentario
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const comment = fileService.findById('comments', id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
        });
      }

      // Verificar que el usuario es el autor
      if (comment.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete your own comments',
        });
      }

      // Actualizar contador en ticket
      const ticket = fileService.findById('tickets', comment.ticketId);
      if (ticket) {
        ticket.interactions.comments--;
        await fileService.updateInCollection('tickets', ticket.id, {
          interactions: ticket.interactions,
        });
      }

      await fileService.deleteFromCollection('comments', id);

      res.json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/comments/:id/like
   * Da like a un comentario
   */
  async like(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const comment = fileService.findById('comments', id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
        });
      }

      const user = fileService.findById('users', userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Verificar si ya dio like
      if (comment.likedBy.includes(userId)) {
        // Quitar like
        comment.likedBy = comment.likedBy.filter(id => id !== userId);
        comment.likes--;
      } else {
        // Agregar like
        comment.likedBy.push(userId);
        comment.likes++;
      }

      const updatedComment = await fileService.updateInCollection('comments', id, {
        likes: comment.likes,
        likedBy: comment.likedBy,
      });

      res.json({
        success: true,
        message: comment.likedBy.includes(userId) ? 'Like added' : 'Like removed',
        data: updatedComment,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CommentController();