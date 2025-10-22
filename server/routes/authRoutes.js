/**
 * Auth Routes - Rutas de autenticación con Supabase
 * La mayoría de la autenticación se maneja en el cliente
 */

import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// Obtener usuario actual (requiere token)
router.get('/me', authController.getCurrentUser.bind(authController));

// Verificar sesión
router.get('/session', authController.checkSession.bind(authController));

// Logout (opcional, el cliente maneja esto)
router.post('/logout', authController.logout.bind(authController));

export default router;