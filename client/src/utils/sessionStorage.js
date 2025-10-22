async function ensureCleanSessionStorage(supabase) {
  try {
    const { data } = await supabase.auth.getSession();
    const hasSupabaseKeys = Object.keys(localStorage).some(k => /supabase|sb-|auth/i.test(k));
    if (!data?.session && hasSupabaseKeys) {
      console.warn('No session found but supabase keys exist -> clearing stale tokens and reloading');
      Object.keys(localStorage)
        .filter(k => /supabase|sb-|auth/i.test(k))
        .forEach(k => localStorage.removeItem(k));
      // opcional: location.reload();
    }
  } catch (e) {
    console.error('ensureCleanSessionStorage error:', e);
    // si hay error, limpiar por si acaso
    Object.keys(localStorage)
      .filter(k => /supabase|sb-|auth/i.test(k))
      .forEach(k => localStorage.removeItem(k));
    location.reload();
  }
}

export default ensureCleanSessionStorage;