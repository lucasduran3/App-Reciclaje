/**
 * Supabase Client Configuration (singleton)
 * Evita re-creaciones en Vite HMR guardando la instancia en globalThis.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY environment variable");
}

// Guardamos la instancia en globalThis para que Vite HMR no la re-cree
if (!globalThis.__supabase) {
  globalThis.__supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // usar localStorage solo si estamos en browser
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      storageKey: "supabase.auth.token", // opcional
    },
    global: {
      headers: {
        "x-application-name": "eco-game-app",
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  // Log opcional en modo dev para verificar comportamiento
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[supabase] created singleton instance");
  }
} else {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[supabase] reusing existing singleton instance");
  }
}

const supabase = globalThis.__supabase;

export { supabase };
export default supabase;
