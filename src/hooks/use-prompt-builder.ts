
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type PromptTemplate = {
  id: string;
  category: string;
  tone?: string;
  audience?: string;
  template_text: string;
  tags?: string[];
  created_at: string;
};

export type PromptSnippet = {
  id: string;
  category: string;
  type: string;
  tone?: string;
  audience?: string;
  snippet_text: string;
  tags?: string[];
  created_at: string;
};

export type PromptBuildingHistory = {
  id: string;
  user_id: string;
  category: string;
  tone?: string;
  audience?: string;
  components?: any;
  created_at: string;
};

export type PromptBuilderFormData = {
  category: string;
  tone?: string;
  audience?: string;
  goal?: string;
  components: Record<string, string>;
};

export function usePromptBuilder() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch templates by category
  const useTemplates = (category?: string) => {
    return useQuery({
      queryKey: ['promptTemplates', category],
      queryFn: async () => {
        let query = supabase
          .from('prompt_templates')
          .select('*');
        
        if (category) {
          query = query.eq('category', category);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        return data as PromptTemplate[];
      },
      enabled: true,
    });
  };

  // Fetch snippets by category and type
  const useSnippets = (category?: string, type?: string) => {
    return useQuery({
      queryKey: ['promptSnippets', category, type],
      queryFn: async () => {
        let query = supabase
          .from('prompt_snippets')
          .select('*');
        
        if (category) {
          query = query.eq('category', category);
        }
        
        if (type) {
          query = query.eq('type', type);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        return data as PromptSnippet[];
      },
      enabled: true,
    });
  };

  // Fetch user's building history
  const useBuilderHistory = () => {
    return useQuery({
      queryKey: ['promptBuilderHistory'],
      queryFn: async () => {
        if (!isAuthenticated) return [];
        
        const { data, error } = await supabase
          .from('prompt_building_history')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        return data as PromptBuildingHistory[];
      },
      enabled: isAuthenticated,
    });
  };

  // Save building history
  const saveBuilderHistory = useMutation({
    mutationFn: async (formData: PromptBuilderFormData) => {
      if (!isAuthenticated || !user) {
        throw new Error('User must be logged in to save prompt building history');
      }
      
      const { error, data } = await supabase
        .from('prompt_building_history')
        .insert({
          user_id: user.id,
          category: formData.category,
          tone: formData.tone,
          audience: formData.audience,
          components: formData.components,
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Progress saved",
        description: "Your prompt building progress has been saved",
      });
      queryClient.invalidateQueries({ queryKey: ['promptBuilderHistory'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: error.message,
      });
    },
  });

  // Get suggestions based on user history
  const getSuggestions = async (formData: Partial<PromptBuilderFormData>) => {
    if (!isAuthenticated || !user) {
      return [];
    }

    try {
      // Get user's previous prompts
      const { data: userPrompts } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get user's building history
      const { data: userHistory } = await supabase
        .from('prompt_building_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Find matching snippets based on category, tone, audience
      let query = supabase
        .from('prompt_snippets')
        .select('*');

      if (formData.category) {
        query = query.eq('category', formData.category);
      }

      if (formData.tone) {
        query = query.eq('tone', formData.tone);
      }

      if (formData.audience) {
        query = query.eq('audience', formData.audience);
      }

      const { data: snippets } = await query.limit(5);

      // Combine and analyze results to provide suggestions
      const suggestions = [];
      
      // Add category suggestions based on user history
      if (!formData.category && userHistory?.length) {
        const categories = userHistory.map(item => item.category);
        const uniqueCategories = [...new Set(categories)];
        
        uniqueCategories.slice(0, 3).forEach(category => {
          suggestions.push({
            type: 'category',
            value: category,
            text: `Try "${category}" based on your history`,
          });
        });
      }
      
      // Add tone suggestions
      if (!formData.tone && userHistory?.length) {
        const tones = userHistory.filter(item => item.tone).map(item => item.tone);
        const uniqueTones = [...new Set(tones)];
        
        uniqueTones.slice(0, 2).forEach(tone => {
          suggestions.push({
            type: 'tone',
            value: tone,
            text: `Use "${tone}" tone based on your preferences`,
          });
        });
      }
      
      // Add snippet suggestions
      if (snippets?.length) {
        snippets.forEach(snippet => {
          suggestions.push({
            type: 'snippet',
            value: snippet.id,
            text: snippet.snippet_text,
            snippet,
          });
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  };

  return {
    useTemplates,
    useSnippets,
    useBuilderHistory,
    saveBuilderHistory,
    getSuggestions,
  };
}
