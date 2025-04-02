import React, { useState, useEffect } from 'react';
import { Prompt } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import PromptCard from './PromptCard';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface RelatedPromptsProps {
  prompt: Prompt;
  limit?: number;
  className?: string;
}

const RelatedPrompts: React.FC<RelatedPromptsProps> = ({
  prompt,
  limit = 3,
  className
}) => {
  const [relatedPrompts, setRelatedPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRelatedPrompts = async () => {
      try {
        setLoading(true);
        
        // Find related prompts based on:
        // 1. Same category
        // 2. Shared tags
        // 3. Public prompts only
        // 4. Not the current prompt
        
        // Get the current prompt's category and tags
        const category = prompt.category;
        const tags = prompt.tags || [];
        
        if (!category && tags.length === 0) {
          setRelatedPrompts([]);
          return;
        }
        
        // Build the query
        let query = supabase
          .from('prompts')
          .select('*')
          .eq('is_public', true)
          .neq('id', prompt.id)
          .order('created_at', { ascending: false });
        
        // Add category filter if available
        if (category) {
          query = query.eq('category', category);
        }
        
        // Execute the query
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        // Filter and sort by tag similarity
        const promptsWithScore = (data || []).map(p => {
          const pTags = p.tags || [];
          // Calculate similarity score based on shared tags
          const sharedTags = pTags.filter(tag => tags.includes(tag));
          const score = sharedTags.length;
          
          return { prompt: p, score };
        });
        
        // Sort by score (highest first) and take the top 'limit'
        const sortedPrompts = promptsWithScore
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(item => item.prompt);
        
        setRelatedPrompts(sortedPrompts);
      } catch (error) {
        console.error('Error fetching related prompts:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load related prompts',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRelatedPrompts();
  }, [prompt.id, prompt.category, prompt.tags, limit, toast]);
  
  if (loading) {
    return (
      <div className={cn("flex justify-center items-center py-8", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (relatedPrompts.length === 0) {
    return null; // Don't show the section if there are no related prompts
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-xl font-semibold">Related Prompts</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedPrompts.map(relatedPrompt => (
          <div key={relatedPrompt.id} className="hover-scale">
            <PromptCard 
              prompt={relatedPrompt} 
              className="h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedPrompts;
