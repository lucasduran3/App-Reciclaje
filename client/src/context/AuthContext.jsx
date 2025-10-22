/**
 * AuthContext - Manejo del usuario actual con Supabase Auth
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import supabase from "../config/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // loader para auth/sdk
  const [profileLoading, setProfileLoading] = useState(false); // loader para profile

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.auth.getSession();
        const initialSession = data?.session ?? null;
        if (!mounted) return;
        setSession(initialSession);

        if (initialSession?.user) {
          // cargar profile pero con su propio loading y manejo de errores
          await loadUserProfile(initialSession.user.id);
        }
      } catch (err) {
        console.error("init auth error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    // suscripción a cambios de auth (forma compatible con versiones recientes)
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);

        if (newSession?.user) {
          await loadUserProfile(newSession.user.id);
        } else {
          setCurrentUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      // unsubscribe: según versión puede ser subscription.unsubscribe()
      try {
        subscription?.unsubscribe?.();
      } catch (e) {
        // fallback si la estructura es diferente
        subscription?.subscription?.unsubscribe?.();
      }
    };
  }, []);
  /**
   * Carga el perfil completo del usuario desde la tabla profiles
   */
  const loadUserProfile = async (userId) => {
    setProfileLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        setCurrentUser(null);
        return null;
      }

      setCurrentUser(profile);
      return profile;
    } catch (err) {
      console.error("loadUserProfile unexpected:", err);
      setCurrentUser(null);
      return null;
    } finally {
      setProfileLoading(false);
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
            last_name: userData.lastName || "",
            role: userData.role || "user",
            city: userData.city || "",
            neighborhood: userData.neighborhood || "",
            avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=maria",
          },
          options: {
            emailRedirectTo: "http://localhost:5173/login",
          },
        },
      });

      if (authError) throw authError;

      // 2. El perfil se crea automáticamente por el trigger de Supabase
      // pero podemos actualizar campos adicionales si es necesario
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            city: userData.city,
            neighborhood: userData.neighborhood,
          })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;

        // Cargar el perfil completo
        await loadUserProfile(authData.user.id);
      }

      return { success: true, user: authData.user };
    } catch (error) {
      console.error("Error registering:", error);
      throw error;
    }
  };

  /**
   * Inicia sesión
   */
  const login = async (email, password) => {
    try {
      // retorna data.session / data.user
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // actualizar estado inmediatamente usando la respuesta
      setSession(data.session ?? null);

      // si hay user, cargar perfil (pero no bloquear todo el authLoading)
      if (data?.user?.id) {
        await loadUserProfile(data.user.id);
      }

      return { success: true };
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
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
      console.error("Error logging out:", error);
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
        .from("profiles")
        .update(updates)
        .eq("id", currentUser.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentUser(data);
      return data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const value = {
    currentUser,
    session,
    loading,
    profileLoading,
    isAuthenticated: !!session,
    register,
    loadUserProfile,
    login,
    logout,
    refreshUser,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
