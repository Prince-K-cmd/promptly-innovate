
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // First, set up the auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user profile on auth change with setTimeout to prevent deadlocks
        setTimeout(async () => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileData) {
            setProfile(profileData);
          }
        }, 0);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    // Then, check for an existing session
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session) {
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
      setLoading(false);
    };

    getSession();

    return () => {
      authListener?.subscription.unsubscribe();
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
    setLoading(false);
    toast({
      title: "Signed out successfully",
    });
  };

  const value = {
    session,
    user,
    profile,
    signUp,
    signIn,
    signOut,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
