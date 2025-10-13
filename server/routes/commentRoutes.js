/**
 * Comment Routes
 */

import express from 'express';
import commentController from '../controllers/commentController.js';

const router = express.Router();

router.get('/', commentController.getAll.bind(commentController));
router.get('/:id', commentController.getById.bind(commentController));
router.post('/', commentController.create.bind(commentController));
router.put('/:id', commentController.update.bind(commentController));
router.delete('/:id', commentController.delete.bind(commentController));
router.post('/:id/like', commentController.like.bind(commentController));

export default router;