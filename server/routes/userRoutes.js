/**
 * User Routes
 */

import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();

router.get('/', userController.getAll.bind(userController));
router.get('/:id', userController.getById.bind(userController));
router.get('/:id/stats', userController.getStats.bind(userController));
router.post('/', userController.create.bind(userController));
router.put('/:id', userController.update.bind(userController));
router.delete('/:id', userController.delete.bind(userController));
router.post('/:id/add-points', userController.addPoints.bind(userController));

export default router;