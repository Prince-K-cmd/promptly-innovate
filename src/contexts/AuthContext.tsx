
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define a Profile interface
interface Profile {
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

type AuthContextType = {
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
};

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastProfileRefresh, setLastProfileRefresh] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize authListener first to avoid race conditions
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event, currentSession?.user?.id);

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      // If user is available, fetch profile data
      if (currentSession?.user) {
        // Use setTimeout to prevent potential deadlocks
        setTimeout(async () => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();

            if (profileData) {
              setProfile(profileData);
            }
          } catch (error) {
            console.error("Error fetching profile:", error);
          }
        }, 0);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    // Then, check for an existing session
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!error && data.session) {
          console.log("Existing session found:", data.session.user.id);
          setSession(data.session);
          setUser(data.session.user);

          // Fetch user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!error && data.user) {
      // Create a profile entry with default avatar
      const username = email.split('@')[0];

      await supabase.from('profiles').insert([
        {
          id: data.user.id,
          username,
          avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
        }
      ]);

      toast({
        title: "Account created successfully",
        description: "Please check your email to confirm your account",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Failed to create account",
        description: error?.message,
      });
    }

    setLoading(false);
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to sign in",
        description: error.message,
      });
    } else {
      toast({
        title: "Signed in successfully",
      });

      // Sync local storage prompts if any
      const localPrompts = localStorage.getItem('promptiverse_prompts');
      if (localPrompts) {
        try {
          const parsedPrompts = JSON.parse(localPrompts);

          for (const prompt of parsedPrompts) {
            await supabase.from('prompts').insert({
              ...prompt,
              user_id: data.user?.id,
              synced_from_local: true,
            });
          }

          // Clear local storage after sync
          localStorage.removeItem('promptiverse_prompts');

          toast({
            title: "Local prompts synced",
            description: `${parsedPrompts.length} prompts have been added to your account.`,
          });
        } catch (e) {
          console.error('Failed to sync local prompts:', e);
        }
      }
    }

    setLoading(false);
    return { error };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();

    // Clear all localStorage data when signing out
    // This ensures a fresh start for the next user
    clearAllLocalStorage();

    setLoading(false);
    toast({
      title: "Signed out successfully",
    });
  };

  // Function to send a password reset email
  const resetPasswordForEmail = async (email: string, redirectTo?: string) => {
    setLoading(true);

    const options = redirectTo ? { redirectTo } : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, options);

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to send reset email",
        description: error.message,
      });
    } else {
      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link",
      });
    }

    return { error };
  };

  // Function to refresh the profile data
  const refreshProfile = async (force = false) => {
    if (!user) return;

    // Prevent excessive refreshes by checking the time since last refresh
    // Only refresh if forced or if it's been more than 2 seconds since the last refresh
    const now = Date.now();
    if (!force && now - lastProfileRefresh < 2000) {
      console.log("Skipping profile refresh - too soon");
      return;
    }

    try {
      setLastProfileRefresh(now);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Error refreshing profile:", error);
        return;
      }

      if (profileData) {
        console.log("Profile refreshed:", profileData);
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  // Use React.useMemo to prevent unnecessary re-renders
  const value = React.useMemo(() => ({
    session,
    user,
    profile,
    signUp,
    signIn,
    signOut,
    resetPasswordForEmail,
    refreshProfile,
    loading,
    isAuthenticated: !!user,
  }), [session, user, profile, loading]);

  console.log("AuthProvider rendering with user:", user?.id);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
