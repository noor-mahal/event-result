// Fill these in from: Supabase Dashboard → Project Settings → API
// The "anon public" key is SAFE to ship in client-side code — it only
// grants what your Row Level Security policies allow (see supabase-schema.sql).
const SUPABASE_URL = "https://jzhlrcgbekcwuinbnsul.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6aGxyY2diZWtjd3VpbmJuc3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MzE5NzUsImV4cCI6MjEwNDEwNzk3NX0.zjP4i_R6fFVIv1XKcRA_nxH6J9A6qUcF0GuXK9Ae-VE";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
