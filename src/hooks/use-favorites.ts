
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Prompt } from '@/lib/supabase';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('favorite_prompts')
        .select('prompt_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setFavorites(data?.map(item => item.prompt_id) || []);
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      toast({
        variant: "destructive",
        title: "Error loading favorites",
        description: err.message || 'Failed to fetch favorites',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (promptId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to favorite prompts",
      });
      return false;
    }

    try {
      const isFavorited = favorites.includes(promptId);

      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorite_prompts')
          .delete()
          .eq('user_id', user.id)
          .eq('prompt_id', promptId);

        if (error) throw error;

        setFavorites(favorites.filter(id => id !== promptId));
        toast({
          title: "Removed from favorites",
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorite_prompts')
          .insert({
            user_id: user.id,
            prompt_id: promptId,
          });

        if (error) throw error;

        setFavorites([...favorites, promptId]);
        toast({
          title: "Added to favorites",
        });
      }

      return true;
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      toast({
        variant: "destructive",
        title: "Error updating favorites",
        description: err.message || 'Failed to update favorites',
      });
      return false;
    }
  };

  const isFavorited = (promptId: string) => {
    return favorites.includes(promptId);
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorited,
    refreshFavorites: fetchFavorites,
  };
};
