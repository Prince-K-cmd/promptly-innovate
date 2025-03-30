
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Favorite {
  id: string;
  user_id: string;
  prompt_id: string;
  created_at: string;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Function to fetch favorites
  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('favorite_prompts')
        .select('*')
        .eq('user_id', user.id);
      
      if (fetchError) throw fetchError;
      
      setFavorites(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch favorites');
      toast({
        variant: "destructive",
        title: "Error loading favorites",
        description: err.message || 'Failed to fetch favorites',
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to add favorite
  const addFavorite = async (promptId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to save favorites",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('favorite_prompts')
        .insert({
          user_id: user.id,
          prompt_id: promptId,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      setFavorites(prev => [...prev, data]);
      
      toast({
        title: "Added to favorites",
        description: "Prompt has been added to your favorites",
      });
      
      return data;
    } catch (err: any) {
      if (err.code === '23505') {
        toast({
          title: "Already in favorites",
          description: "This prompt is already in your favorites",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to add favorite",
          description: err.message || 'An error occurred',
        });
      }
      return null;
    }
  };

  // Function to remove favorite
  const removeFavorite = async (promptId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('favorite_prompts')
        .delete()
        .eq('user_id', user.id)
        .eq('prompt_id', promptId);
      
      if (error) throw error;
      
      // Update local state
      setFavorites(prev => prev.filter(fav => fav.prompt_id !== promptId));
      
      toast({
        title: "Removed from favorites",
        description: "Prompt has been removed from your favorites",
      });
      
      return true;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to remove favorite",
        description: err.message || 'An error occurred',
      });
      return false;
    }
  };

  // Check if a prompt is favorited
  const isFavorite = (promptId: string) => {
    return favorites.some(fav => fav.prompt_id === promptId);
  };

  // Load favorites on component mount and when user changes
  useEffect(() => {
    fetchFavorites();
  }, [user]);

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
    refreshFavorites: fetchFavorites,
  };
};
