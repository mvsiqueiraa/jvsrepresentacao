(function setupJvsSupabase() {
  const config = window.JVS_SUPABASE_CONFIG || {};
  const hasConfig =
    config.url &&
    config.anonKey &&
    !config.url.includes("COLE_AQUI") &&
    !config.anonKey.includes("COLE_AQUI");

  window.jvsSupabaseReady = Boolean(hasConfig && window.supabase);
  window.jvsSupabase = window.jvsSupabaseReady
    ? window.supabase.createClient(config.url, config.anonKey)
    : null;
})();
