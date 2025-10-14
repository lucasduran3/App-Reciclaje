/**
 * AuthContext - Manejo del usuario actual
 * En producción, esto vendría de un sistema de autenticación real
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import userService from '../services/userService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      // Por ahora, cargamos el primer usuario (user-001)
      // En producción, esto vendría de localStorage o sesión
      const userId = localStorage.getItem('currentUserId') || 'user-001';
      const response = await userService.getById(userId);
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error loading current user:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (currentUser) {
      const response = await userService.getById(currentUser.id);
      setCurrentUser(response.data);
    }
  };

  const switchUser = async (userId) => {
    try {
      const response = await userService.getById(userId);
      setCurrentUser(response.data);
      localStorage.setItem('currentUserId', userId);
    } catch (error) {
      console.error('Error switching user:', error);
    }
  };

  const value = {
    currentUser,
    loading,
    refreshUser,
    switchUser,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}