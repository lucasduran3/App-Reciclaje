/**
 * Comment Controller - Controlador de comentarios con Supabase
 */

import supabaseService from '../services/supabaseService.js';

class CommentController {
  /**
   * GET /api/comments
   * Obtiene todos los comentarios con filtros opcionales
   */
  async getAll(req, res, next) {
    try {
      const { ticketId, userId } = req.query;

      let comments = await supabaseService.query('comments', (query) => {
        let q = query.order('created_at', { ascending: true });

        if (ticketId) q = q.eq('ticket_id', ticketId);
        if (userId) q = q.eq('user_id', userId);

        return q;
      });

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
      const comment = await supabaseService.getById('comments', id);

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
      if (!commentData.content || commentData.content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Content cannot be empty',
        });
      }

      if (commentData.content.length > 500) {
        return res.status(400).json({
          success: false,
          error: 'Content must be less than 500 characters',
        });
      }

      // Verificar que ticket y usuario existen
      const ticket = await supabaseService.getById('tickets', commentData.ticket_id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found',
        });
      }

      const user = await supabaseService.getById('profiles', commentData.user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Crear comentario
      const newComment = {
        ticket_id: commentData.ticket_id,
        user_id: commentData.user_id,
        content: commentData.content.trim(),
      };

      const createdComment = await supabaseService.create('comments', newComment);

      // Actualizar contador de comentarios en ticket
      const interactions = ticket.interactions || { likes: 0, views: 0, comments: 0, liked_by: [] };
      interactions.comments = (interactions.comments || 0) + 1;
      
      await supabaseService.update('tickets', ticket.id, { interactions });

      // Actualizar stats del usuario
      const userStats = user.stats || {};
      userStats.comments_given = (userStats.comments_given || 0) + 1;
      await supabaseService.update('profiles', user.id, { stats: userStats });

      // Dar puntos al dueño del ticket
      const reporter = await supabaseService.getById('profiles', ticket.reported_by);
      if (reporter && reporter.id !== user.id) {
        const reporterStats = reporter.stats || {};
        reporterStats.comments_received = (reporterStats.comments_received || 0) + 1;
        
        await supabaseService.update('profiles', reporter.id, {
          stats: reporterStats,
          points: reporter.points + 10,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: createdComment,
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

      const comment = await supabaseService.getById('comments', id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
        });
      }

      // Verificar que el usuario es el autor
      if (comment.user_id !== userId) {
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

      const updatedComment = await supabaseService.update('comments', id, {
        content: content.trim(),
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

      const comment = await supabaseService.getById('comments', id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
        });
      }

      // Verificar que el usuario es el autor
      if (comment.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete your own comments',
        });
      }

      // Actualizar contador en ticket
      const ticket = await supabaseService.getById('tickets', comment.ticket_id);
      if (ticket) {
        const interactions = ticket.interactions || { likes: 0, views: 0, comments: 0, liked_by: [] };
        interactions.comments = Math.max(0, (interactions.comments || 0) - 1);
        
        await supabaseService.update('tickets', ticket.id, { interactions });
      }

      await supabaseService.delete('comments', id);

      res.json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CommentController();