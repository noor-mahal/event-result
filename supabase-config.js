// Fill these in from: Supabase Dashboard → Project Settings → API
// The "anon public" key is SAFE to ship in client-side code — it only
// grants what your Row Level Security policies allow (see supabase-schema.sql).
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
