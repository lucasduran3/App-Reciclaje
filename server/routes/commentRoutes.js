/**
 * Comment Routes
 * Crear este archivo en server/routes/commentRoutes.js
 */

import express from 'express';
import supabaseService from '../services/supabaseService.js';

const router = express.Router();

/**
 * GET /api/comments
 * Obtiene todos los comentarios
 */
router.get('/', async (req, res, next) => {
  try {
    const comments = supabaseService.getAll('comments');
    
    res.json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/comments/ticket/:ticketId
 * Obtiene comentarios de un ticket específico
 */
router.get('/ticket/:ticketId', async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const comments = supabaseService.getAll('comments');
    const ticketComments = comments.filter(c => c.ticketId === ticketId);
    
    res.json({
      success: true,
      count: ticketComments.length,
      data: ticketComments
    });
  } catch (error) {
    next(error);
  }
});

export default router;