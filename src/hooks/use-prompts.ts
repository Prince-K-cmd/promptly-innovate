
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Prompt } from '@/lib/supabase';

export const usePrompts = (category?: string, searchTerm?: string, tags?: string[]) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPrompts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, get locally stored prompts (for both logged-in and non-logged-in users)
      const localPromptsString = localStorage.getItem('promptiverse_prompts');
      const localPrompts: Prompt[] = localPromptsString ? JSON.parse(localPromptsString) : [];
      
      let filteredLocalPrompts = [...localPrompts];
      
      if (category && category !== 'all') {
        filteredLocalPrompts = filteredLocalPrompts.filter(p => p.category === category);
      }
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredLocalPrompts = filteredLocalPrompts.filter(p => 
          p.title?.toLowerCase().includes(term) || 
          p.text?.toLowerCase().includes(term) || 
          p.description?.toLowerCase().includes(term)
        );
      }
      
      if (tags && tags.length > 0) {
        filteredLocalPrompts = filteredLocalPrompts.filter(p => 
          p.tags && tags.some(tag => p.tags.includes(tag))
        );
      }
      
      // Then, for logged-in users, get prompts from Supabase too
      if (user) {
        let query = supabase
          .from('prompts')
          .select('*')
          .order('created_at', { ascending: false });
        
        query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
        
        if (category && category !== 'all') {
          query = query.eq('category', category);
        }
        
        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,text.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }
        
        if (tags && tags.length > 0) {
          const tagConditions = tags.map(tag => `tags.cs.{${tag}}`);
          query = query.or(tagConditions.join(','));
        }
        
        const { data, error: fetchError } = await query;
        
        if (fetchError) {
          throw fetchError;
        }
        
        setPrompts([...filteredLocalPrompts, ...(data || [])]);
      } else {
        // For non-logged-in users, also get public prompts from Supabase
        let query = supabase
          .from('prompts')
          .select('*')
          .order('created_at', { ascending: false })
          .eq('is_public', true);
        
        if (category && category !== 'all') {
          query = query.eq('category', category);
        }
        
        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,text.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }
        
        if (tags && tags.length > 0) {
          const tagConditions = tags.map(tag => `tags.cs.{${tag}}`);
          query = query.or(tagConditions.join(','));
        }
        
        const { data, error: fetchError } = await query;
        
        if (fetchError) {
          throw fetchError;
        }
        
        setPrompts([...filteredLocalPrompts, ...(data || [])]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prompts');
      toast({
        variant: "destructive",
        title: "Error loading prompts",
        description: err.message || 'Failed to fetch prompts',
      });
    } finally {
      setLoading(false);
    }
  };

  const createPrompt = async (promptData: Omit<Prompt, 'id' | 'created_at' | 'user_id' | 'updated_at'>) => {
    try {
      if (user) {
        const { data, error } = await supabase
          .from('prompts')
          .insert({
            ...promptData,
            user_id: user.id,
          })
          .select();
          
        if (error) throw error;
        
        setPrompts(prev => [data[0], ...prev]);
        
        toast({
          title: "Prompt created",
          description: "Your prompt has been saved successfully.",
        });
        
        return data[0];
      } else {
        const id = `local-${Date.now()}`;
        const now = new Date().toISOString();
        const newPrompt = {
          id,
          created_at: now,
          updated_at: now,
          ...promptData,
          user_id: 'local',
        };
        
        const existingPrompts = localStorage.getItem('promptiverse_prompts');
        const prompts = existingPrompts ? JSON.parse(existingPrompts) : [];
        
        localStorage.setItem('promptiverse_prompts', JSON.stringify([newPrompt, ...prompts]));
        
        setPrompts(prev => [newPrompt, ...prev]);
        
        toast({
          title: "Prompt saved locally",
          description: "Sign in to sync your prompts to your account.",
        });
        
        return newPrompt;
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to create prompt",
        description: err.message || 'An error occurred',
      });
      throw err;
    }
  };

  const updatePrompt = async (id: string, promptData: Partial<Prompt>) => {
    try {
      if (id.startsWith('local-') || !user) {
        // Handle local prompts or when user is not logged in
        const existingPrompts = localStorage.getItem('promptiverse_prompts');
        const prompts = existingPrompts ? JSON.parse(existingPrompts) : [];
        
        const updatedPrompts = prompts.map((p: Prompt) => 
          p.id === id ? { ...p, ...promptData, updated_at: new Date().toISOString() } : p
        );
        
        localStorage.setItem('promptiverse_prompts', JSON.stringify(updatedPrompts));
        
        setPrompts(prev => prev.map(p => p.id === id ? { ...p, ...promptData, updated_at: new Date().toISOString() } : p));
        
        toast({
          title: "Prompt updated locally",
          description: "Sign in to sync your prompts to your account.",
        });
        
        return { id, ...promptData, updated_at: new Date().toISOString() };
      } else {
        // Check if the user owns this prompt before updating
        const { data: promptData, error: promptError } = await supabase
          .from('prompts')
          .select('user_id')
          .eq('id', id)
          .single();
        
        if (promptError) throw promptError;
        
        if (promptData.user_id !== user.id) {
          throw new Error('You do not have permission to update this prompt');
        }
        
        const { data, error } = await supabase
          .from('prompts')
          .update({
            ...promptData,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select();
          
        if (error) throw error;
        
        setPrompts(prev => prev.map(p => p.id === id ? { ...p, ...promptData, updated_at: new Date().toISOString() } : p));
        
        toast({
          title: "Prompt updated",
          description: "Your changes have been saved.",
        });
        
        return data[0];
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to update prompt",
        description: err.message || 'An error occurred',
      });
      throw err;
    }
  };

  const deletePrompt = async (id: string) => {
    try {
      if (id.startsWith('local-') || !user) {
        // Handle local prompts or when user is not logged in
        const existingPrompts = localStorage.getItem('promptiverse_prompts');
        const prompts = existingPrompts ? JSON.parse(existingPrompts) : [];
        
        const filteredPrompts = prompts.filter((p: Prompt) => p.id !== id);
        
        localStorage.setItem('promptiverse_prompts', JSON.stringify(filteredPrompts));
        
        setPrompts(prev => prev.filter(p => p.id !== id));
        
        toast({
          title: "Prompt deleted",
        });
        
        return true;
      } else {
        // Check if the user owns this prompt before deleting
        const { data: promptData, error: promptError } = await supabase
          .from('prompts')
          .select('user_id')
          .eq('id', id)
          .single();
        
        if (promptError) throw promptError;
        
        if (promptData.user_id !== user.id) {
          throw new Error('You do not have permission to delete this prompt');
        }
        
        const { error } = await supabase
          .from('prompts')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        setPrompts(prev => prev.filter(p => p.id !== id));
        
        toast({
          title: "Prompt deleted",
        });
        
        return true;
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete prompt",
        description: err.message || 'An error occurred',
      });
      throw err;
    }
  };

  // Function to share a prompt - creates a copy for the current user
  const sharePrompt = async (prompt: Prompt) => {
    try {
      const { id, created_at, updated_at, user_id, ...promptData } = prompt;
      const sharedPromptData = {
        ...promptData,
        title: `${promptData.title} (Shared)`,
        is_public: false, // Default to private for shared prompts
      };
      
      return await createPrompt(sharedPromptData);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to share prompt",
        description: err.message || 'An error occurred',
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [user, category, searchTerm, tags?.join(',')]);

  return {
    prompts,
    loading,
    error,
    createPrompt,
    updatePrompt,
    deletePrompt,
    sharePrompt,
    refreshPrompts: fetchPrompts,
  };
};
