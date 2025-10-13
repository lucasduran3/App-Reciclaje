/**
 * Mission Routes
 */

import express from 'express';
import missionController from '../controllers/missionController.js';

const router = express.Router();

router.get('/', missionController.getAll.bind(missionController));
router.get('/:id', missionController.getById.bind(missionController));
router.put('/:id', missionController.update.bind(missionController));
router.post('/:id/increment', missionController.incrementProgress.bind(missionController));
router.post('/regenerate', missionController.regenerate.bind(missionController));

export default router;