/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail gracefully instead of crashing on module load if keys are missing
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Mock database wrapper for demonstration if Supabase is not configured yet
export const getDatabase = () => {
    if (supabase) return supabase;
    console.warn("Supabase is not configured. Falling back to mock data.");
    return null;
}
