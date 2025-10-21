/**
 * Auth Controller - Controlador de autenticación
 * Ubicación: server/controllers/authController.js
 */

import authService from '../services/authService.js';

class AuthController {
  /**
   * POST /api/auth/register
   * Registra nuevo usuario
   */
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        message: 'Cuenta creada exitosamente',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Autentica usuario
   */
  async login(req, res, next) {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          error: 'Identificador y contraseña son requeridos',
        });
      }

      const result = await authService.login(identifier, password);

      res.json({
        success: true,
        message: 'Login exitoso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Obtiene usuario actual (requiere autenticación)
   */
  async getCurrentUser(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Token no proporcionado',
        });
      }

      const user = await authService.getCurrentUser(token);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Cierra sesión (solo cliente limpia token)
   */
  async logout(req, res) {
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  }
}

export default new AuthController();