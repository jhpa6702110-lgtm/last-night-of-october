import { createClient } from '@supabase/supabase-js';

// Get credentials: prioritize LocalStorage overrides so users can configure/correct it via UI,
// and fall back to environment variables.
let supabaseUrl = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
let supabaseAnonKey = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabase !== null;
};

// Helper to save credentials to LocalStorage (used in Admin interface)
export const saveSupabaseCredentials = (url, anonKey) => {
  localStorage.setItem('supabase_url', url.trim());
  localStorage.setItem('supabase_anon_key', anonKey.trim());
  window.location.reload(); // Reload to apply credentials
};

// Helper to clear credentials
export const clearSupabaseCredentials = () => {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_anon_key');
  window.location.reload();
};
