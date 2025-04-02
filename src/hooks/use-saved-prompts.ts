import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Prompt } from '@/lib/supabase';
import { eventEmitter, EVENTS } from '@/lib/events';

export const useSavedPrompts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Define the type for saved prompts
  type SavedPromptWithDetails = {
    id: string;
    user_id: string;
    prompt_id: string;
    created_at: string;
    prompt: Prompt;
  };

  // Query key for saved prompts
  const savedPromptsKey = ['savedPrompts', user?.id];

  // Fetch saved prompts
  const { data: savedPrompts = [], isLoading: isFetchingPrompts } = useQuery({
    queryKey: savedPromptsKey,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('saved_prompts')
        .select('*, prompts(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved prompts:', error);
        throw error;
      }

      // Transform the data to include the full prompt details
      return data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        prompt_id: item.prompt_id,
        created_at: item.created_at,
        prompt: item.prompts as Prompt
      }));
    },
    enabled: !!user,
  });

  // Check if a prompt is saved
  const isSaved = useCallback((promptId: string) => {
    // For spotlight prompts, we need to check if any prompt with the 'spotlight_copy' tag exists
    if (promptId.startsWith('spotlight-')) {
      // Get the spotlight prompt from localStorage
      const spotlightCache = localStorage.getItem('promptiverse_spotlight_prompt');
      if (!spotlightCache) return false;

      try {
        const parsedCache = JSON.parse(spotlightCache);
        const spotlightPrompt = parsedCache.prompt;

        // If this isn't the current spotlight prompt, return false
        if (spotlightPrompt.id !== promptId) return false;

        // Check if any saved prompt has the same text and is tagged with 'spotlight_copy'
        return savedPrompts.some(item =>
          item.prompt?.text === spotlightPrompt.text &&
          item.prompt?.tags?.includes('spotlight_copy')
        );
      } catch (e) {
        console.error('Error parsing spotlight cache:', e);
        return false;
      }
    }

    // For regular prompts, just check if the ID is in the saved prompts
    return savedPrompts.some(item => item.prompt_id === promptId);
  }, [savedPrompts]);

  // Save a prompt to the user's collection
  const savePrompt = useMutation({
    mutationFn: async (promptId: string) => {
      if (!user) {
        throw new Error('You must be logged in to save prompts');
      }

      setLoading(true);

      try {
        // Check if this is a spotlight prompt (has a non-UUID format)
        const isSpotlightPrompt = promptId.startsWith('spotlight-');

        let promptData: Partial<Prompt> & { id?: string; title?: string; text?: string; category?: string; tags?: string[]; description?: string };

        if (isSpotlightPrompt) {
          // For spotlight prompts, get the data from localStorage
          const spotlightCache = localStorage.getItem('promptiverse_spotlight_prompt');
          if (spotlightCache) {
            const parsedCache = JSON.parse(spotlightCache);
            promptData = parsedCache.prompt;

            // Verify this is the correct spotlight prompt
            if (promptData.id !== promptId) {
              promptData = null;
            }
          }

          if (!promptData) {
            throw new Error('Spotlight prompt not found in cache');
          }
        } else {
          // For regular prompts, check if the prompt exists in the database
          const { data, error: promptError } = await supabase
            .from('prompts')
            .select('*')
            .eq('id', promptId)
            .single();

          if (promptError || !data) {
            throw new Error('Prompt not found');
          }

          promptData = data;
        }

        // Check if already saved
        const { data: existingData } = await supabase
          .from('saved_prompts')
          .select('*')
          .eq('user_id', user.id)
          .eq('prompt_id', promptId)
          .maybeSingle();

        if (existingData) {
          throw new Error('Prompt already saved to your collection');
        }

        // For spotlight prompts, we need to create a copy in the database first
        if (isSpotlightPrompt) {
          // Create a copy of the spotlight prompt with a proper UUID
          const { title, text, category, tags, description } = promptData;

          // Insert the prompt copy
          const { data: newPrompt, error: insertError } = await supabase
            .from('prompts')
            .insert({
              title,
              text,
              category,
              tags: [...(tags || []), 'spotlight_copy'],
              description: description || 'Copied from spotlight prompt',
              is_public: false, // Make it private by default
              user_id: user.id
            })
            .select('*')
            .single();

          if (insertError || !newPrompt) {
            throw new Error('Failed to create a copy of the spotlight prompt');
          }

          // Now save this new prompt to the user's collection
          const { data, error } = await supabase
            .from('saved_prompts')
            .insert({
              user_id: user.id,
              prompt_id: newPrompt.id,
            })
            .select('*')
            .single();

          if (error) {
            throw error;
          }

          // Return the saved prompt with the new prompt data
          return {
            id: data.id,
            user_id: data.user_id,
            prompt_id: data.prompt_id,
            created_at: data.created_at,
            prompt: newPrompt as Prompt
          };
        } else {
          // For regular prompts, just save the reference
          const { data, error } = await supabase
            .from('saved_prompts')
            .insert({
              user_id: user.id,
              prompt_id: promptId,
            })
            .select('*, prompts(*)')
            .single();

          if (error) {
            throw error;
          }

          // Transform the data to include the full prompt details
          return {
            id: data.id,
            user_id: data.user_id,
            prompt_id: data.prompt_id,
            created_at: data.created_at,
            prompt: data.prompts as Prompt
          };
        }
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (data) => {
      // Update the cache
      queryClient.setQueryData<SavedPromptWithDetails[]>(savedPromptsKey, (old) => [...(old || []), data]);

      // Show success toast
      toast({
        title: 'Prompt saved',
        description: 'The prompt has been added to your collection',
      });

      // Emit event for other components to react
      eventEmitter.emit(EVENTS.SAVED_PROMPTS_CHANGED);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to save prompt',
        description: error.message,
      });
    },
  });

  // Remove a prompt from the user's collection
  const removeSavedPrompt = useMutation({
    mutationFn: async (promptId: string) => {
      if (!user) {
        throw new Error('You must be logged in to manage your saved prompts');
      }

      setLoading(true);

      try {
        // For spotlight prompts, we need to find the corresponding saved prompt
        if (promptId.startsWith('spotlight-')) {
          // Get the spotlight prompt from localStorage
          const spotlightCache = localStorage.getItem('promptiverse_spotlight_prompt');
          if (!spotlightCache) {
            throw new Error('Spotlight prompt not found in cache');
          }

          try {
            const parsedCache = JSON.parse(spotlightCache);
            const spotlightPrompt = parsedCache.prompt;

            // If this isn't the current spotlight prompt, return false
            if (spotlightPrompt.id !== promptId) {
              throw new Error('Spotlight prompt ID mismatch');
            }

            // Find saved prompts that match the spotlight text and have the spotlight_copy tag
            const { data: savedCopies, error: findError } = await supabase
              .from('prompts')
              .select('id')
              .eq('user_id', user.id)
              .eq('text', spotlightPrompt.text)
              .contains('tags', ['spotlight_copy']);

            if (findError) {
              throw new Error('Error finding spotlight copies');
            }

            if (!savedCopies || savedCopies.length === 0) {
              throw new Error('No saved copies of this spotlight prompt found');
            }

            // Get the IDs of the saved copies
            const copyIds = savedCopies.map(copy => copy.id);

            // Find saved_prompts entries for these copies
            const { data: savedPromptEntries, error: entriesError } = await supabase
              .from('saved_prompts')
              .select('id')
              .eq('user_id', user.id)
              .in('prompt_id', copyIds);

            if (entriesError || !savedPromptEntries || savedPromptEntries.length === 0) {
              throw new Error('No saved entries found for this spotlight prompt');
            }

            // Delete all saved_prompts entries
            const entryIds = savedPromptEntries.map(entry => entry.id);
            const { error: deleteError } = await supabase
              .from('saved_prompts')
              .delete()
              .in('id', entryIds);

            if (deleteError) {
              throw deleteError;
            }

            return promptId;
          } catch (e) {
            console.error('Error removing spotlight prompt:', e);
            throw new Error('Failed to remove spotlight prompt from collection');
          }
        } else {
          // For regular prompts, just find and delete the saved_prompts entry
          const { data: savedPromptData, error: findError } = await supabase
            .from('saved_prompts')
            .select('id')
            .eq('user_id', user.id)
            .eq('prompt_id', promptId)
            .maybeSingle();

          if (findError || !savedPromptData) {
            throw new Error('Saved prompt not found');
          }

          // Delete the saved prompt entry
          const { error } = await supabase
            .from('saved_prompts')
            .delete()
            .eq('id', savedPromptData.id);

          if (error) {
            throw error;
          }

          return promptId;
        }
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (promptId) => {
      // Update the cache
      queryClient.setQueryData<SavedPromptWithDetails[]>(savedPromptsKey, (old) =>
        (old || []).filter((item) => item.prompt_id !== promptId)
      );

      // Show success toast
      toast({
        title: 'Prompt removed',
        description: 'The prompt has been removed from your collection',
      });

      // Emit event for other components to react
      eventEmitter.emit(EVENTS.SAVED_PROMPTS_CHANGED);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to remove prompt',
        description: error.message,
      });
    },
  });

  // Save an edited prompt
  const saveEditedPrompt = useMutation<{ id: string; user_id: string; prompt_id: string; created_at: string; prompt: Prompt }, Error, { promptId: string; editedPrompt: Partial<Prompt> }>({
    mutationFn: async ({ promptId, editedPrompt }) => {
      if (!user) {
        throw new Error('You must be logged in to save prompts');
      }

      setLoading(true);

      try {
        // Check if this is a spotlight prompt
        const isSpotlightPrompt = promptId.startsWith('spotlight-');

        // For spotlight prompts, create a new prompt with the edited data
        if (isSpotlightPrompt) {
          // Insert the edited prompt
          const { data: newPrompt, error: insertError } = await supabase
            .from('prompts')
            .insert({
              title: editedPrompt.title,
              text: editedPrompt.text,
              category: editedPrompt.category,
              tags: [...(editedPrompt.tags || []), 'spotlight_copy'],
              description: editedPrompt.description,
              is_public: editedPrompt.is_public || false,
              user_id: user.id
            })
            .select('*')
            .single();

          if (insertError || !newPrompt) {
            throw new Error('Failed to create a copy of the spotlight prompt');
          }

          // Now save this new prompt to the user's collection
          const { data, error } = await supabase
            .from('saved_prompts')
            .insert({
              user_id: user.id,
              prompt_id: newPrompt.id,
            })
            .select('*')
            .single();

          if (error) {
            throw error;
          }

          // Return the saved prompt with the new prompt data
          return {
            id: data.id,
            user_id: data.user_id,
            prompt_id: data.prompt_id,
            created_at: data.created_at,
            prompt: newPrompt as Prompt
          };
        } else {
          // For regular prompts, update the existing prompt and save it
          // First, check if the prompt exists
          const { data: existingPrompt, error: findError } = await supabase
            .from('prompts')
            .select('*')
            .eq('id', promptId)
            .single();

          if (findError || !existingPrompt) {
            throw new Error('Prompt not found');
          }

          // Check if the user owns this prompt
          if (existingPrompt.user_id !== user.id) {
            // Create a copy of the prompt with the edited data
            const { data: newPrompt, error: insertError } = await supabase
              .from('prompts')
              .insert({
                title: editedPrompt.title,
                text: editedPrompt.text,
                category: editedPrompt.category,
                tags: editedPrompt.tags,
                description: editedPrompt.description,
                is_public: editedPrompt.is_public || false,
                user_id: user.id
              })
              .select('*')
              .single();

            if (insertError || !newPrompt) {
              throw new Error('Failed to create a copy of the prompt');
            }

            // Now save this new prompt to the user's collection
            const { data, error } = await supabase
              .from('saved_prompts')
              .insert({
                user_id: user.id,
                prompt_id: newPrompt.id,
              })
              .select('*')
              .single();

            if (error) {
              throw error;
            }

            // Return the saved prompt with the new prompt data
            return {
              id: data.id,
              user_id: data.user_id,
              prompt_id: data.prompt_id,
              created_at: data.created_at,
              prompt: newPrompt as Prompt
            };
          } else {
            // Update the existing prompt
            const { data: updatedPrompt, error: updateError } = await supabase
              .from('prompts')
              .update({
                title: editedPrompt.title,
                text: editedPrompt.text,
                category: editedPrompt.category,
                tags: editedPrompt.tags,
                description: editedPrompt.description,
                is_public: editedPrompt.is_public,
                updated_at: new Date().toISOString()
              })
              .eq('id', promptId)
              .select('*')
              .single();

            if (updateError || !updatedPrompt) {
              throw new Error('Failed to update the prompt');
            }

            // Check if already saved
            const { data: existingData } = await supabase
              .from('saved_prompts')
              .select('*')
              .eq('user_id', user.id)
              .eq('prompt_id', promptId)
              .maybeSingle();

            if (existingData) {
              // Already saved, return the existing saved prompt with updated prompt data
              return {
                id: existingData.id,
                user_id: existingData.user_id,
                prompt_id: existingData.prompt_id,
                created_at: existingData.created_at,
                prompt: updatedPrompt as Prompt
              };
            }

            // Save the prompt to the collection
            const { data, error } = await supabase
              .from('saved_prompts')
              .insert({
                user_id: user.id,
                prompt_id: promptId,
              })
              .select('*')
              .single();

            if (error) {
              throw error;
            }

            // Return the saved prompt with the updated prompt data
            return {
              id: data.id,
              user_id: data.user_id,
              prompt_id: data.prompt_id,
              created_at: data.created_at,
              prompt: updatedPrompt as Prompt
            };
          }
        }
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (data) => {
      // Update the cache
      queryClient.setQueryData<SavedPromptWithDetails[]>(savedPromptsKey, (old) => [...(old || []), data]);

      // Show success toast
      toast({
        title: 'Prompt saved',
        description: 'The prompt has been added to your collection',
      });

      // Emit event for other components to react
      eventEmitter.emit(EVENTS.SAVED_PROMPTS_CHANGED);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to save prompt',
        description: error.message,
      });
    },
  });

  return {
    savedPrompts,
    loading: loading || isFetchingPrompts,
    isSaved,
    savePrompt: (promptId: string) => savePrompt.mutate(promptId),
    saveEditedPrompt: (promptId: string, editedPrompt: Partial<Prompt>) =>
      saveEditedPrompt.mutate({ promptId, editedPrompt }),
    removeSavedPrompt: (promptId: string) => removeSavedPrompt.mutate(promptId),
  };
};
