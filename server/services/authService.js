/**
 * Auth Service - Servicio de autenticación
 * Ubicación: server/services/authService.js
 */

import crypto from 'crypto';
import fileService from './fileService.js';
import { generateId } from '../utils/idGenerator.js';

class AuthService {
  /**
   * Hash de contraseña usando crypto (simula bcrypt)
   * En producción usar bcrypt.hash()
   */
  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verifica contraseña
   */
  verifyPassword(password, hashedPassword) {
    const [salt, originalHash] = hashedPassword.split(':');
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
    return hash === originalHash;
  }

  /**
   * Genera token JWT simple (en producción usar jsonwebtoken)
   */
  generateToken(userId) {
    const payload = {
      userId,
      timestamp: Date.now(),
      random: crypto.randomBytes(16).toString('hex')
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Verifica y decodifica token
   */
  verifyToken(token) {
    try {
      const payload = JSON.parse(
        Buffer.from(token, 'base64').toString('utf-8')
      );
      
      // Token válido por 30 días
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - payload.timestamp > thirtyDays) {
        return null;
      }
      
      return payload.userId;
    } catch {
      return null;
    }
  }

  /**
   * Valida datos de registro
   */
  validateRegistration(data) {
    const errors = [];

    // Role
    if (!['user', 'sponsor'].includes(data.role)) {
      errors.push('Role debe ser "user" o "sponsor"');
    }

    // Name
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Nombre debe tener al menos 2 caracteres');
    }

    // LastName (requerido solo para users)
    if (data.role === 'user') {
      if (!data.lastName || data.lastName.trim().length < 2) {
        errors.push('Apellido es requerido para usuarios');
      }
    }

    // Username
    if (!data.username || data.username.trim().length < 3) {
      errors.push('Username debe tener al menos 3 caracteres');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      errors.push('Username solo puede contener letras, números y guión bajo');
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      errors.push('Email inválido');
    }

    // Ciudad y barrio
    if (!data.city || data.city.trim().length < 2) {
      errors.push('Ciudad es requerida');
    }
    if (!data.neighborhood || data.neighborhood.trim().length < 2) {
      errors.push('Barrio es requerido');
    }

    // Password
    if (!data.password || data.password.length < 8) {
      errors.push('Contraseña debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(data.password)) {
      errors.push('Contraseña debe contener al menos una mayúscula');
    }
    if (!/[a-z]/.test(data.password)) {
      errors.push('Contraseña debe contener al menos una minúscula');
    }
    if (!/[0-9]/.test(data.password)) {
      errors.push('Contraseña debe contener al menos un número');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Registra nuevo usuario
   */
  async register(userData) {
    // Validar datos
    const validation = this.validateRegistration(userData);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    const users = fileService.getCollection('users');

    // Verificar email único
    if (users.some(u => u.email === userData.email)) {
      const error = new Error('El correo electrónico ya está en uso');
      error.statusCode = 409;
      throw error;
    }

    // Verificar username único
    if (users.some(u => u.username === userData.username)) {
      const error = new Error('El nombre de usuario ya está en uso');
      error.statusCode = 409;
      throw error;
    }

    // Crear usuario
    const newUser = {
      id: generateId('user'),
      role: userData.role,
      name: userData.name.trim(),
      lastName: userData.role === 'user' ? userData.lastName.trim() : '',
      username: userData.username.trim().toLowerCase(),
      email: userData.email.trim().toLowerCase(),
      password: this.hashPassword(userData.password),
      city: userData.city.trim(),
      neighborhood: userData.neighborhood.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
      points: 0,
      level: 1,
      streak: 0,
      lastActivityDate: new Date().toISOString().split('T')[0],
      zone: `${userData.city} - ${userData.neighborhood}`,
      stats: {
        ticketsReported: 0,
        ticketsAccepted: 0,
        ticketsCleaned: 0,
        ticketsValidated: 0,
        missionsCompleted: 0,
        likesGiven: 0,
        likesReceived: 0,
        commentsGiven: 0,
        commentsReceived: 0,
      },
      badges: [],
      preferences: {
        notifications: true,
        publicProfile: true,
        theme: 'light',
      },
      createdAt: new Date().toISOString(),
    };

    await fileService.addToCollection('users', newUser);

    // Generar token
    const token = this.generateToken(newUser.id);

    // No devolver password
    const { password, ...userWithoutPassword } = newUser;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Login de usuario
   */
  async login(identifier, password) {
    const users = fileService.getCollection('users');

    // Buscar por email o username
    const user = users.find(
      u => 
        u.email === identifier.toLowerCase() || 
        u.username === identifier.toLowerCase()
    );

    if (!user) {
      const error = new Error('Credenciales inválidas');
      error.statusCode = 401;
      throw error;
    }

    // Verificar contraseña
    const isValid = this.verifyPassword(password, user.password);
    if (!isValid) {
      const error = new Error('Credenciales inválidas');
      error.statusCode = 401;
      throw error;
    }

    // Generar token
    const token = this.generateToken(user.id);

    // No devolver password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Obtiene usuario actual desde token
   */
  async getCurrentUser(token) {
    const userId = this.verifyToken(token);
    
    if (!userId) {
      const error = new Error('Token inválido o expirado');
      error.statusCode = 401;
      throw error;
    }

    const user = fileService.findById('users', userId);
    
    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // No devolver password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export default new AuthService();