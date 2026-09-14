export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

/** Si Supabase no está configurado, la app opera en modo Demo/Local de forma transparente */
export function shouldUseDemoAuth() {
  if (import.meta.env.PROD && isSupabaseConfigured) return false;
  return !isSupabaseConfigured;
}

export function shouldUseRemoteData() {
  return isSupabaseConfigured;
}
