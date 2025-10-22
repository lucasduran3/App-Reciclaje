/**
 * Auth Controller - Controlador de autenticación con Supabase
 * La autenticación se maneja principalmente en el cliente
 * El servidor solo proporciona endpoints auxiliares si son necesarios
 */

import supabase from '../config/supabase.js';
import supabaseService from '../services/supabaseService.js';

class AuthController {
  /**
   * GET /api/auth/me
   * Obtiene usuario actual (requiere token de Supabase)
   */
  async getCurrentUser(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Token no proporcionado',
        });
      }

      const token = authHeader.replace('Bearer ', '');

      // Verificar el token con Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido o expirado',
        });
      }

      // Obtener perfil completo
      const profile = await supabaseService.getById('profiles', user.id);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Perfil de usuario no encontrado',
        });
      }

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Cierra sesión (el cliente maneja esto, este endpoint es opcional)
   */
  async logout(req, res) {
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  }

  /**
   * GET /api/auth/session
   * Verifica si hay una sesión activa
   */
  async checkSession(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({
          success: true,
          authenticated: false,
        });
      }

      const token = authHeader.replace('Bearer ', '');

      const { data: { user }, error } = await supabase.auth.getUser(token);

      res.json({
        success: true,
        authenticated: !error && !!user,
        user: user || null,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();