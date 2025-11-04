import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import supabase from "../config/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Refs para control de estado
  const mountedRef = useRef(true);
  const initializingRef = useRef(false);
  const subscriptionRef = useRef(null);

  // ==================== INICIALIZACIÓN ====================
  useEffect(() => {
    let isMounted = true;
    mountedRef.current = true;

    const initializeAuth = async () => {
      // Prevenir inicializaciones múltiples
      if (initializingRef.current) {
        console.log("Initialization already in progress");
        return;
      }

      initializingRef.current = true;
      console.log("Initializing auth...");

      try {
        setAuthLoading(true);

        // 1. Obtener sesión inicial
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          if (isMounted) {
            setSession(null);
            setCurrentUser(null);
          }
          return;
        }

        console.log("Initial session:", initialSession ? "Found" : "None");

        if (isMounted) {
          setSession(initialSession);

          // 2. Cargar perfil si hay sesión
          if (initialSession?.user?.id) {
            await loadUserProfile(initialSession.user.id, isMounted);
          }
        }

        // 3. Configurar listener de cambios (SOLO UNA VEZ)
        if (!subscriptionRef.current) {
          setupAuthListener(isMounted);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (isMounted) {
          setSession(null);
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
        initializingRef.current = false;
      }
    };

    initializeAuth();

    // Cleanup
    return () => {
      isMounted = false;
      mountedRef.current = false;

      // Limpiar listener al desmontar
      if (subscriptionRef.current) {
        console.log("🧹 Cleaning up auth listener");
        subscriptionRef.current.unsubscribe?.();
        subscriptionRef.current = null;
      }
    };
  }, []); //SIN DEPENDENCIAS - Solo se ejecuta una vez

  // ==================== AUTH LISTENER ====================
  const setupAuthListener = (isMounted) => {
    console.log("Setting up auth state listener");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // Validar que el componente sigue montado
      if (!isMounted || !mountedRef.current) {
        console.log("⚠️ Component unmounted, ignoring auth change");
        return;
      }

      console.log(
        "Auth event:",
        event,
        newSession ? "with session" : "no session"
      );

      // Manejar eventos específicos
      switch (event) {
        case "SIGNED_IN":
        case "TOKEN_REFRESHED":
        case "USER_UPDATED":
          if (newSession) {
            setSession(newSession);
            if (newSession.user?.id) {
              await loadUserProfile(newSession.user.id, isMounted);
            }
          }
          break;

        case "SIGNED_OUT":
          setSession(null);
          setCurrentUser(null);
          break;

        case "INITIAL_SESSION":
          // Ya manejado en initializeAuth, ignorar aquí
          console.log("Skipping INITIAL_SESSION (handled in init)");
          break;

        default:
          console.log("Unhandled auth event:", event);
      }
    });

    subscriptionRef.current = subscription;
  };

  // ==================== CARGAR PERFIL ====================
  const loadUserProfile = async (userId, isMounted = true) => {
    if (!userId) return null;

    console.log("👤 Loading profile for:", userId);
    setProfileLoading(true);

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        if (isMounted && mountedRef.current) {
          setCurrentUser(null);
        }
        return null;
      }

      if (isMounted && mountedRef.current) {
        console.log("Profile loaded:", profile.username);
        setCurrentUser(profile);
      }

      return profile;
    } catch (err) {
      console.error("Unexpected error loading profile:", err);
      if (isMounted && mountedRef.current) {
        setCurrentUser(null);
      }
      return null;
    } finally {
      if (isMounted && mountedRef.current) {
        setProfileLoading(false);
      }
    }
  };

  // ==================== REGISTER ====================
  const register = async (userData) => {
    console.log("Registering user:", userData.username);

    try {
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
            avatar_url: `https://api.dicebear.com/9.x/avataaars/svg?seed=${userData.username}`,
          },
          emailRedirectTo: window.location.origin + "/login",
        },
      });

      if (authError) throw authError;

      // Actualizar ciudad y barrio en el perfil
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            city: userData.city,
            neighborhood: userData.neighborhood,
          })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;

        // Cargar perfil completo
        await loadUserProfile(authData.user.id);
      }

      console.log("User registered successfully");
      return { success: true, user: authData.user };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  // ==================== LOGIN ====================
  const login = async (email, password) => {
    console.log("🔑 Logging in:", email);
    setAuthLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log("Login successful");

      // Actualizar estado inmediatamente
      setSession(data.session);

      // Cargar perfil
      if (data.user?.id) {
        await loadUserProfile(data.user.id);
      }

      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  // ==================== LOGOUT ====================
  const logout = async () => {
    console.log("Logging out...");

    try {
      // Limpiar estado local primero
      setSession(null);
      setCurrentUser(null);

      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      console.log("Logout successful");
      return { success: true };
    } catch (err) {
      console.error("Logout error:", err);
      throw err;
    }
  };

  // ==================== VALOR DEL CONTEXTO ====================
  const value = {
    session,
    currentUser,
    authLoading,
    profileLoading,
    isAuthenticated: !!session,
    login,
    register,
    logout,
    loadUserProfile,
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
