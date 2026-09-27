import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mpmqhimaurahzexaphcs.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbXFoaW1hdXJhaHpleGFwaGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4Mzk4OTgsImV4cCI6MjA4MjQxNTg5OH0.p8hHzjwAsDESL9ZL3zdeUcdW2oqmwvtzYNE9uT346Us";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbXFoaW1hdXJhaHpleGFwaGNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzOTg5OCwiZXhwIjoyMDgyNDE1ODk4fQ.poCZrwVY0P9tDJxukAcVJ-HOwKoR7MJ9L3_Udo1B1gg";

// Public client for anonymous or user-delegated actions (e.g. login, token refresh)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Admin client for backend user creation and role assignments bypassing email confirmations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});