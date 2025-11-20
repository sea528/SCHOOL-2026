
import { createClient } from '@supabase/supabase-js';

// NOTE: In a real application, these should be in a .env file.
// Since we cannot ensure the user has set these up, we check validity.
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Check if the variables are set to valid values (not the placeholders/empty)
export const isSupabaseConfigured =
  SUPABASE_URL &&
  SUPABASE_URL.length > 0 &&
  SUPABASE_URL !== 'https://your-project.supabase.co' &&
  SUPABASE_ANON_KEY &&
  SUPABASE_ANON_KEY.length > 0 &&
  SUPABASE_ANON_KEY !== 'your-anon-key';

// If configured, create the client. Otherwise, create a dummy client to prevent runtime crash before fallback logic takes over.
export const supabase = createClient(
  isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? SUPABASE_ANON_KEY : 'placeholder'
);
