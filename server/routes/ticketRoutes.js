/**
 * Ticket Routes
 */

import express from 'express';
import ticketController from '../controllers/ticketController.js';

const router = express.Router();

router.get('/', ticketController.getAll.bind(ticketController));
router.get('/:id', ticketController.getById.bind(ticketController));
router.post('/', ticketController.create.bind(ticketController));
router.put('/:id', ticketController.update.bind(ticketController));
router.delete('/:id', ticketController.delete.bind(ticketController));
router.post('/:id/accept', ticketController.accept.bind(ticketController));
router.post('/:id/complete', ticketController.complete.bind(ticketController));
router.post('/:id/validate', ticketController.validate.bind(ticketController));
router.post('/:id/like', ticketController.like.bind(ticketController));

export default router;