/**
 * AuthContext - Manejo del usuario actual con Supabase Auth
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../config/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Obtener sesión inicial
    initializeAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setCurrentUser(null);
        }
        
        setLoading(false);
      }
    );

    // Cleanup
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Inicializa la autenticación cargando la sesión actual
   */
  const initializeAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      setSession(session);

      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga el perfil completo del usuario desde la tabla profiles
   */
  const loadUserProfile = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setCurrentUser(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setCurrentUser(null);
    }
  };

  /**
   * Registra un nuevo usuario
   */
  const register = async (userData) => {
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            name: userData.name,
            last_name: userData.lastName || '',
            role: userData.role || 'user'
          }
        }
      });

      if (authError) throw authError;

      // 2. El perfil se crea automáticamente por el trigger de Supabase
      // pero podemos actualizar campos adicionales si es necesario
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            city: userData.city,
            neighborhood: userData.neighborhood,
            zone: `${userData.city} - ${userData.neighborhood}`
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        // Cargar el perfil completo
        await loadUserProfile(authData.user.id);
      }

      return { success: true, user: authData.user };
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  };

  /**
   * Inicia sesión
   */
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // El perfil se carga automáticamente por onAuthStateChange
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  /**
   * Cierra sesión
   */
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setCurrentUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  /**
   * Refresca el perfil del usuario actual
   */
  const refreshUser = async () => {
    if (session?.user) {
      await loadUserProfile(session.user.id);
    }
  };

  /**
   * Actualiza el perfil del usuario
   */
  const updateProfile = async (updates) => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentUser(data);
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    session,
    loading,
    isAuthenticated: !!session,
    register,
    login,
    logout,
    refreshUser,
    updateProfile
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