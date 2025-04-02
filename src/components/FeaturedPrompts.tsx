import React, { useState, useEffect } from 'react';
import { Prompt } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import PromptCard from './PromptCard';
import { Zap } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface FeaturedPromptsProps {
  limit?: number;
}

const FeaturedPrompts: React.FC<FeaturedPromptsProps> = ({ limit = 3 }) => {
  const [featuredPrompts, setFeaturedPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFeaturedPrompts = async () => {
      try {
        setLoading(true);

        // Get prompts that are public, have high engagement, and are tagged as featured
        // Only get prompts that are specifically marked as featured (not from other users)
        let query = supabase
          .from('prompts')
          .select('*')
          .eq('is_public', true);

        // Only include prompts that have the 'featured' tag
        query = query.contains('tags', ['featured']);

        // Get the data
        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

        if (error) {
          throw error;
        }

        // Use the data directly since we've already filtered for featured prompts
        setFeaturedPrompts(data || []);
      } catch (error) {
        console.error('Error fetching featured prompts:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load featured prompts',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPrompts();
  }, [limit, toast]);

  if (loading) {
    return (
      <div className="mb-10">
        <div className="flex items-center mb-6">
          <Zap className="h-6 w-6 mr-2 text-yellow-500" />
          <h2 className="text-2xl font-bold">Featured Prompts</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={`featured-skeleton-${Date.now()}-${i}`} className="rounded-lg overflow-hidden">
              <Skeleton className="h-[220px] w-full shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (featuredPrompts.length === 0 && !loading) {
    return (
      <div className="mb-10">
        <div className="flex items-center mb-6">
          <Zap className="h-6 w-6 mr-2 text-yellow-500" />
          <h2 className="text-2xl font-bold">Featured Prompts</h2>
        </div>
        <div className="bg-muted/30 rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No featured prompts available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <div className="flex items-center mb-6">
        <Zap className="h-6 w-6 mr-2 text-yellow-500" />
        <h2 className="text-2xl font-bold">Featured Prompts</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredPrompts.map(prompt => (
          <div key={prompt.id} className="hover-scale">
            <PromptCard
              prompt={prompt}
              className="h-full"
            />
            {prompt.tags?.includes('featured') && (
              <div className="relative">
                <span className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full featured-badge flex items-center">
                  <Zap className="h-3 w-3 mr-1" />
                  Featured
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedPrompts;
