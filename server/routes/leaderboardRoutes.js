/**
 * Leaderboard Routes
 */

import express from 'express';
import leaderboardController from '../controllers/leaderboardController.js';

const router = express.Router();

router.get('/', leaderboardController.get.bind(leaderboardController));
router.get('/user/:id', leaderboardController.getUserPosition.bind(leaderboardController));
router.post('/regenerate', leaderboardController.regenerate.bind(leaderboardController));

export default router;