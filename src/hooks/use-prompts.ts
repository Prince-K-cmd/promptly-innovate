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

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterType === 'user' && user) {
        query = query.eq('user_id', user.id);
      } else if (filterType === 'community') {
        query = query.eq('is_public', true);
        if (user) {
          query = query.neq('user_id', user.id);
        }
      } else if (filterType === 'library' && user) {
        const { data: savedPromptIds, error: savedError } = await supabase
          .from('saved_prompts')
          .select('prompt_id')
          .eq('user_id', user.id);

        if (savedError) {
          console.error('Error fetching saved prompts:', savedError);
          query = query.eq('user_id', user.id);
        } else {
          const promptIds = savedPromptIds.map(item => item.prompt_id);

          if (promptIds.length > 0) {
            query = query.or(`user_id.eq.${user.id},id.in.(${promptIds.join(',')})`);
          } else {
            query = query.eq('user_id', user.id);
          }
        }
      } else if (filterType === 'all' && user) {
        query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
      } else if (!user) {
        query = query.eq('is_public', true);
      } else {
        query = query.eq('user_id', user.id);
      }

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

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

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

      if (!user) {
        const localPromptsString = localStorage.getItem('promptiverse_prompts');
        const localPrompts = localPromptsString ? JSON.parse(localPromptsString) : [];

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
      if (id.startsWith('local-')) {
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
      if (id.startsWith('local-')) {
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
