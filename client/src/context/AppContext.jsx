/**
 * AppContext - Estado global de la aplicación con Supabase
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../config/supabase';
import userService from '../services/userService';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
    
    // Suscribirse a cambios en usuarios
    const subscription = supabase
      .channel('users-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          // Recargar usuarios cuando hay cambios
          loadUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getAll();
      setUsers(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshUsers = async () => {
    await loadUsers();
  };

  const value = {
    users,
    loading,
    error,
    refreshUsers,
    // Mantener compatibilidad con código anterior
    appData: {
      users,
    },
    refreshData: refreshUsers,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}