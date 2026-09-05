// Supabase configuration
const SUPABASE_URL = "https://jzhlrcgbekcwuinbnsul.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6aGxyY2diZWtjd3VpbmJuc3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MzE5NzUsImV4cCI6MjEwNDEwNzk3NX0.zjP4i_R6fFVIv1XKcRA_nxH6J9A6qUcF0GuXK9Ae-VE";

if (!window.supabase || typeof window.supabase.createClient !== "function") {
  throw new Error("Supabase SDK failed to load. Please refresh the page.");
}

window.appSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
