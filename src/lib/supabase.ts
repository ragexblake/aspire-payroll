import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here' || supabaseKey === 'your_supabase_anon_key_here') {
  console.warn('Supabase environment variables not configured. Using demo mode.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder-key'
);

export type Database = {
  public: {
    Tables: {
      plants: {
        Row: {
          id: string;
          name: string;
          location: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string;
          created_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: 'admin' | 'manager';
          plant_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role: 'admin' | 'manager';
          plant_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: 'admin' | 'manager';
          plant_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
};