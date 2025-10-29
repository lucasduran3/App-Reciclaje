/**
 * Authentication Middleware
 * server/middleware/auth.js
 */

import supabase from "../config/supabase.js";

/**
 * Middleware para verificar autenticación con Supabase
 * Extrae el token del header Authorization y verifica el usuario
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Token de autenticación no proporcionado",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verificar el token con Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: "Token inválido o expirado",
      });
    }

    // Agregar el usuario a la request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      error: "Error de autenticación",
    });
  }
}

/**
 * Middleware opcional de autenticación
 * No bloquea la petición si no hay token, solo agrega el usuario si existe
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      req.user = user;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    req.user = null;
    next();
  }
}
