
import { Session, User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  bio?: string;
  website?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Allow for additional properties
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string, redirectTo?: string) => Promise<{ error: any }>;
  refreshProfile: (force?: boolean) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}
