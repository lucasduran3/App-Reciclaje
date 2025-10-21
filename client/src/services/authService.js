/**
 * Auth Service - Servicio de autenticación cliente
 * Ubicación: client/src/services/authService.js
 */

import apiClient from './apiClient';

const TOKEN_KEY = 'eco_game_token';
const USER_KEY = 'eco_game_user';

class AuthService {
  /**
   * Registra nuevo usuario
   */
  async register(userData) {
    const response = await apiClient.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (response.success) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
    }

    return response;
  }

  /**
   * Login de usuario
   */
  async login(identifier, password) {
    const response = await apiClient.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });

    if (response.success) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
    }

    return response;
  }

  /**
   * Cierra sesión
   */
  async logout() {
    await apiClient.request('/auth/logout', {
      method: 'POST'
    });

    this.clearAuth();
  }

  /**
   * Obtiene usuario actual
   */
  async getCurrentUser() {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await apiClient.request('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.success) {
      this.setUser(response.data);
    }

    return response.data;
  }

  /**
   * Guarda token en localStorage
   */
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Obtiene token de localStorage
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Guarda usuario en localStorage
   */
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Obtiene usuario de localStorage
   */
  getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Verifica si hay sesión activa
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Limpia datos de autenticación
   */
  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Valida fortaleza de contraseña
   */
  validatePasswordStrength(password) {
    const strength = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(strength).filter(Boolean).length;

    return {
      ...strength,
      score,
      level: score < 3 ? 'weak' : score < 4 ? 'medium' : 'strong',
      isValid: strength.length && strength.uppercase && strength.lowercase && strength.number
    };
  }
}

export default new AuthService();