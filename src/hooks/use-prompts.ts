
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Prompt } from '@/lib/supabase';

interface UsePromptsOptions {
  category?: string;
  searchTerm?: string;
  tags?: string[];
  filterType?: 'all' | 'user' | 'community' | 'library';
  page?: number;
  pageSize?: number;
}

export const usePrompts = (options?: UsePromptsOptions) => {
  const {
    category,
    searchTerm,
    tags,
    filterType,
    page = 1,
    pageSize = 12
  } = options || {};
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Function to fetch prompts - wrapped in useCallback to prevent recreation on every render
  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filter based on filterType
      if (filterType === 'user' && user) {
        // Only user's prompts (created by them), both public and private
        query = query.eq('user_id', user.id);
      } else if (filterType === 'community') {
        // Only public prompts from other users (not the current user's)
        query = query.eq('is_public', true);
        if (user) {
          // Explicitly exclude the current user's prompts
          query = query.neq('user_id', user.id);
        }
      } else if (filterType === 'library' && user) {
        // User's library: their own prompts + saved community prompts
        // First, get the IDs of prompts the user has saved
        const { data: savedPromptIds, error: savedError } = await supabase
          .from('saved_prompts')
          .select('prompt_id')
          .eq('user_id', user.id);

        if (savedError) {
          console.error('Error fetching saved prompts:', savedError);
          // Fallback to just showing user's own prompts
          query = query.eq('user_id', user.id);
        } else {
          // Include both user's own prompts and saved prompts
          const promptIds = savedPromptIds.map(item => item.prompt_id);

          if (promptIds.length > 0) {
            // User has saved prompts, include them along with their own prompts
            query = query.or(`user_id.eq.${user.id},id.in.(${promptIds.join(',')})`);
          } else {
            // User hasn't saved any prompts, just show their own
            query = query.eq('user_id', user.id);
          }
        }
      } else if (filterType === 'all' && user) {
        // All accessible prompts for logged-in users: their own + public ones from others
        query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
      } else if (!user) {
        // Default behavior for non-logged in users - only public prompts
        query = query.eq('is_public', true);
      } else {
        // Default for logged-in users - show only their own prompts
        query = query.eq('user_id', user.id);
      }

      // Apply category filter if provided
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      // Apply search term if provided
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,text.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Apply tags filter if provided
      if (tags && tags.length > 0) {
        const tagConditions = tags.map(tag => `tags.cs.{${tag}}`);
        query = query.or(tagConditions.join(','));
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Get total count for pagination
      const { count } = await supabase
        .from('prompts')
        .select('id', { count: 'exact', head: true });

      if (count !== null) {
        setTotalCount(count);
        setTotalPages(Math.ceil(count / pageSize));
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // If user is not logged in, merge with local storage prompts
      if (!user) {
        const localPromptsString = localStorage.getItem('promptiverse_prompts');
        const localPrompts = localPromptsString ? JSON.parse(localPromptsString) : [];

        // Filter local prompts based on category, search term, and tags
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

        // Combine server and local prompts
        setPrompts([...filteredLocalPrompts, ...(data || [])]);
      } else {
        setPrompts(data || []);
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
  }, [user, category, searchTerm, tags, filterType, page, pageSize, toast]);

  // Function to create a new prompt
  const createPrompt = async (promptData: Omit<Prompt, 'id' | 'created_at' | 'user_id' | 'updated_at'>) => {
    try {
      if (user) {
        // Create prompt in Supabase
        const { data, error } = await supabase
          .from('prompts')
          .insert({
            ...promptData,
            user_id: user.id,
          })
          .select();

        if (error) throw error;

        // Update local state
        setPrompts(prev => [data[0], ...prev]);

        toast({
          title: "Prompt created",
          description: "Your prompt has been saved successfully.",
        });

        return data[0];
      } else {
        // Store prompt in localStorage
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

        // Update local state
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

  // Function to update a prompt
  const updatePrompt = async (id: string, promptData: Partial<Prompt>) => {
    try {
      if (id.startsWith('local-')) {
        // Update prompt in localStorage
        const existingPrompts = localStorage.getItem('promptiverse_prompts');
        const prompts = existingPrompts ? JSON.parse(existingPrompts) : [];

        const updatedPrompts = prompts.map((p: Prompt) =>
          p.id === id ? { ...p, ...promptData, updated_at: new Date().toISOString() } : p
        );

        localStorage.setItem('promptiverse_prompts', JSON.stringify(updatedPrompts));

        // Update local state
        setPrompts(prev => prev.map(p => p.id === id ? { ...p, ...promptData, updated_at: new Date().toISOString() } : p));

        toast({
          title: "Prompt updated locally",
          description: "Sign in to sync your prompts to your account.",
        });

        return { id, ...promptData, updated_at: new Date().toISOString() };
      } else {
        // Update prompt in Supabase
        const { data, error } = await supabase
          .from('prompts')
          .update({
            ...promptData,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select();

        if (error) throw error;

        // Update local state
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

  // Function to delete a prompt
  const deletePrompt = async (id: string) => {
    try {
      if (id.startsWith('local-')) {
        // Delete prompt from localStorage
        const existingPrompts = localStorage.getItem('promptiverse_prompts');
        const prompts = existingPrompts ? JSON.parse(existingPrompts) : [];

        const filteredPrompts = prompts.filter((p: Prompt) => p.id !== id);

        localStorage.setItem('promptiverse_prompts', JSON.stringify(filteredPrompts));

        // Update local state
        setPrompts(prev => prev.filter(p => p.id !== id));

        toast({
          title: "Prompt deleted",
        });

        return true;
      } else {
        // Delete prompt from Supabase
        const { error } = await supabase
          .from('prompts')
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Update local state
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



  // Load prompts on component mount and when filters change
  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  return {
    prompts,
    loading,
    error,
    createPrompt,
    updatePrompt,
    deletePrompt,
    refreshPrompts: fetchPrompts,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      pageSize
    },
  };
};
