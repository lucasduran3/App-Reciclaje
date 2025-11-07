/**
 * Supabase Client - Singleton con soporte para cookies en producción
 * CRÍTICO: Esta instancia NUNCA debe recrearse
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación de variables de entorno
if (!supabaseUrl) {
  throw new Error(
    "Missing VITE_SUPABASE_URL environment variable. " +
      "Add it to your .env file or Vercel environment variables."
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_ANON_KEY environment variable. " +
      "Add it to your .env file or Vercel environment variables."
  );
}

// ==================== SINGLETON PATTERN ====================
// Previene recreaciones durante HMR (Vite) y garantiza una única instancia

if (!globalThis.__supabase) {
  console.log("🔧 Creating Supabase client singleton");

  globalThis.__supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // CRÍTICO: Persistir sesión en localStorage (NO cookies por ahora)
      persistSession: true,

      // Detectar sesión en URL (para magic links, OAuth)
      detectSessionInUrl: true,

      // Auto-refresh token antes de expirar
      autoRefreshToken: true,

      // Storage personalizado (localStorage en browser)
      storage: typeof window !== "undefined" ? window.localStorage : undefined,

      // Clave de storage única
      storageKey: "sb-auth-token",

      // OPCIONAL: Flowtype para SSR (no necesario en tu caso)
      flowType: "pkce",
    },

    // Headers globales
    global: {
      headers: {
        "x-application-name": "eco-game-client",
      },
    },

    // Configuración de realtime (ajustar según necesidad)
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },

    // CRÍTICO: Configuración de red
    db: {
      schema: "public",
    },
  });

  // Log en desarrollo
  if (import.meta.env.DEV) {
    console.log("Supabase client created");
    console.log("URL:", supabaseUrl);
    console.log("Auth storage:", "localStorage");
  }
} else {
  // Reutilizar instancia existente (HMR en desarrollo)
  if (import.meta.env.DEV) {
    console.log("Reusing existing Supabase client singleton");
  }
}

// ==================== EXPORTAR INSTANCIA ====================
const supabase = globalThis.__supabase;

// Helper para verificar sesión sin triggers
export const getStoredSession = () => {
  if (typeof window === "undefined") return null;

  try {
    const key = "sb-auth-token";
    const stored = window.localStorage.getItem(key);

    if (!stored) return null;

    const session = JSON.parse(stored);
    return session;
  } catch {
    return null;
  }
};

export { supabase };
export default supabase;
