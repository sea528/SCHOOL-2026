
import { createClient } from '@supabase/supabase-js';

// Helper to safely access env vars in browser environments (Vite/Vercel)
const getEnvVar = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Fallback for Vite/Vercel where process might be undefined
  try {
    // @ts-ignore
    return import.meta.env[key] || import.meta.env[`VITE_${key}`];
  } catch (e) {
    return undefined;
  }
};

const SUPABASE_URL = getEnvVar('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = getEnvVar('SUPABASE_ANON_KEY') || '';

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
