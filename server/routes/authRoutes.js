/**
 * Auth Routes - Rutas de autenticación
 * Ubicación: server/routes/authRoutes.js
 */

import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.get('/me', authController.getCurrentUser.bind(authController));
router.post('/logout', authController.logout.bind(authController));

export default router;