
import { createClient } from '@supabase/supabase-js';

// Use publicly available keys for client-side operations
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database schema
export type Prompt = {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  text: string;
  category: string;
  tags: string[];
  description?: string;
  is_public: boolean;
};

export type Profile = {
  id: string;
  created_at: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
};
