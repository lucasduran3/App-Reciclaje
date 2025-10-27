/**
 * Ticket Routes - Updated with Authentication
 * server/routes/ticketRoutes.js
 */

import express from 'express';
import ticketController from '../controllers/ticketController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas (con auth opcional para likes, etc)
router.get('/', optionalAuth, ticketController.getAll.bind(ticketController));
router.get('/:id', optionalAuth, ticketController.getById.bind(ticketController));

// Rutas protegidas (requieren autenticación)
router.post('/', requireAuth, ticketController.create.bind(ticketController));
router.put('/:id', requireAuth, ticketController.update.bind(ticketController));
router.delete('/:id', requireAuth, ticketController.delete.bind(ticketController));
router.post('/:id/accept', requireAuth, ticketController.accept.bind(ticketController));
router.post('/:id/complete', requireAuth, ticketController.complete.bind(ticketController));
router.post('/:id/validate', requireAuth, ticketController.validate.bind(ticketController));
router.post('/:id/like', requireAuth, ticketController.like.bind(ticketController));
router.post('/:id/comments', requireAuth, ticketController.addComment.bind(ticketController));

export default router;