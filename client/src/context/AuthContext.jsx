import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import supabase from "../config/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const lastAccessTokenRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const init = async () => {
      try {
        setAuthLoading(true);
        const { data } = await supabase.auth.getSession();
        const initialSession = data?.session ?? null;
        console.log("init getSession ->", initialSession);
        if (!mountedRef.current) return;
        setSession(initialSession);
        if (initialSession?.user?.id) {
          await loadUserProfile(initialSession.user.id);
        }
      } catch (err) {
        console.error("initializeAuth error:", err);
      } finally {
        if (mountedRef.current) setAuthLoading(false);
      }
    };

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        try {
          console.log("onAuthStateChange event:", event, newSession);
          const token =
            newSession?.access_token ??
            newSession?.session?.access_token ??
            null;
          // deduplicar si es la misma sesión ya procesada
          if (token && token === lastAccessTokenRef.current) {
            console.log("Ignored duplicate auth event");
            return;
          }
          lastAccessTokenRef.current = token;
          setSession(newSession);
          if (newSession?.user?.id) {
            await loadUserProfile(newSession.user.id);
          } else {
            setCurrentUser(null);
          }
        } catch (e) {
          console.error("onAuthStateChange handler error:", e);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      try {
        subscription?.unsubscribe?.();
      } catch (e) {
        // fallback para versiones distintas del SDK
        subscription?.subscription?.unsubscribe?.();
      }
    };
  }, []);

  async function loadUserProfile(userId) {
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
  }

  // LOGIN que usa la respuesta inmediata
  async function login(email, password) {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // data.session / data.user
      console.log("signInWithPassword response:", data);
      setSession(data.session ?? null);
      if (data?.user?.id) {
        await loadUserProfile(data.user.id);
      }
      return { success: true };
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setCurrentUser(null);
      return { success: true };
    } catch (err) {
      console.error("Logout error", err);
      throw err;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        currentUser,
        authLoading,
        profileLoading,
        isAuthenticated: !!session,
        login,
        logout,
        loadUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
