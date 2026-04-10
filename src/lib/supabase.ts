import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// If the user only provided the project ID, format it as a full URL
if (supabaseUrl && !supabaseUrl.startsWith('http') && !supabaseUrl.includes('.')) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}

if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  console.warn('VITE_SUPABASE_URL is missing or invalid. Using placeholder.');
  supabaseUrl = 'https://placeholder.supabase.co';
}

if (!supabaseAnonKey) {
  supabaseAnonKey = 'placeholder-key';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
