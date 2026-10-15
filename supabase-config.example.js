// Copy this file to supabase-config.js to connect a Supabase project.
// Only a publishable key belongs in browser code. Never use a secret or service-role key.
window.LEAGUEILLION_SUPABASE_CONFIG = {
  url: "YOUR_PROJECT_URL",
  publishableKey: "YOUR_PUBLISHABLE_KEY"
};

(() => {
  const { url, publishableKey } = window.LEAGUEILLION_SUPABASE_CONFIG;
  const hasConfig = url.startsWith("https://") && !url.includes("YOUR_") && !publishableKey.includes("YOUR_");
  window.leagueillionSupabase = hasConfig && window.supabase
    ? window.supabase.createClient(url, publishableKey)
    : null;
})();
