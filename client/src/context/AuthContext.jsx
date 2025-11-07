import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import supabase from "../config/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ==================== CARGAR PERFIL ====================
  const loadUserProfile = useCallback(async (userId) => {
    if (!userId) return null;

    console.log("👤 Loading profile for:", userId);

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

      console.log("Profile loaded:", profile.username);
      setCurrentUser(profile);
      return profile;
    } catch (err) {
      console.error("Unexpected error loading profile:", err);
      setCurrentUser(null);
      return null;
    }
  }, []);

  // ==================== INICIALIZACIÓN (UNA SOLA VEZ) ====================
  useEffect(() => {
    let subscription = null;

    const initializeAuth = async () => {
      console.log("Initializing auth...");
      setAuthLoading(true);

      try {
        // 1. Obtener sesión inicial de localStorage
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setSession(null);
          setCurrentUser(null);
          setAuthLoading(false);
          return;
        }

        console.log(
          "Initial session:",
          initialSession ? "Found" : "None"
        );

        // 2. Configurar estado inicial
        setSession(initialSession);

        if (initialSession?.user?.id) {
          await loadUserProfile(initialSession.user.id);
        }

        // 3. Configurar listener SOLO UNA VEZ
        const {
          data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log(
            "Auth event:",
            event,
            newSession ? "with session" : "no session"
          );

          // Actualizar session state
          setSession(newSession);

          // Manejar eventos específicos
          switch (event) {
            case "SIGNED_IN":
            case "TOKEN_REFRESHED":
              if (newSession?.user?.id) {
                await loadUserProfile(newSession.user.id);
              }
              break;

            case "SIGNED_OUT":
              setCurrentUser(null);
              break;

            case "INITIAL_SESSION":
              // Ya manejado arriba, ignorar
              break;

            default:
              console.log("ℹUnhandled auth event:", event);
          }
        });

        subscription = authSubscription;
        console.log("Auth listener configured");
      } catch (error) {
        console.error("Error initializing auth:", error);
        setSession(null);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    initializeAuth();

    // CRÍTICO: Cleanup solo se ejecuta al DESMONTAR el componente
    return () => {
      console.log("🧹 Cleaning up auth listener (component unmounting)");
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []); // Array vacío = se ejecuta UNA SOLA VEZ

  // ==================== REGISTER ====================
  const register = useCallback(
    async (userData) => {
      console.log("Registering user:", userData.username);
      setAuthLoading(true);

      try {
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
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
          }
        );

        if (authError) throw authError;

        // Actualizar perfil con ciudad/barrio
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
      } finally {
        setAuthLoading(false);
      }
    },
    [loadUserProfile]
  );

  // ==================== LOGIN ====================
  const login = useCallback(
    async (email, password) => {
      console.log("🔑 Logging in:", email);
      setAuthLoading(true);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        console.log("Login successful");

        // El listener onAuthStateChange se encargará de actualizar el estado
        // pero actualizamos inmediatamente para mejor UX
        setSession(data.session);

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
    },
    [loadUserProfile]
  );

  // ==================== LOGOUT ====================
  const logout = useCallback(async () => {
    console.log("🚪 Logging out...");

    try {
      // Limpiar estado local primero (para UX inmediata)
      setCurrentUser(null);

      // Cerrar sesión en Supabase (esto dispara SIGNED_OUT en el listener)
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      console.log("Logout successful");
      return { success: true };
    } catch (err) {
      console.error("Logout error:", err);
      // Aún si falla, limpiar estado local
      setSession(null);
      setCurrentUser(null);
      throw err;
    }
  }, []);

  // ==================== VALOR DEL CONTEXTO ====================
  const value = {
    session,
    currentUser,
    authLoading,
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
