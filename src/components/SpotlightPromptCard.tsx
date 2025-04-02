import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Prompt } from '@/lib/supabase';
import { Copy, Check, Zap, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import AddToMyPromptsDialog from './AddToMyPromptsDialog';

interface SpotlightPromptCardProps {
  prompt: Prompt;
  className?: string;
}

const SpotlightPromptCard: React.FC<SpotlightPromptCardProps> = ({
  prompt,
  className
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showFullText, setShowFullText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAddingToPrompts, setIsAddingToPrompts] = useState(false);

  // Truncate text for display
  const truncatedText = prompt.text.length > 150 ? `${prompt.text.substring(0, 150)}...` : prompt.text;

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.text);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "The prompt has been copied to your clipboard",
    });

    setTimeout(() => setCopied(false), 2000);
  };

  // Handle add to my prompts
  const handleAddToMyPrompts = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to add this prompt to your library",
      });
      return;
    }
    setIsAddingToPrompts(true);
  };

  return (
    <>
      <Card className={cn("h-full flex flex-col", className)}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">{prompt.title || 'Spotlight Prompt'}</h3>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                  <Zap className="h-3 w-3 mr-1" />
                  Spotlight
                </Badge>
              </div>
              {prompt.description && (
                <p className="text-muted-foreground text-sm">{prompt.description}</p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3 flex-grow">
          <div className="bg-muted/40 p-3 rounded-md">
            <p className="whitespace-pre-wrap">
              {showFullText ? prompt.text : truncatedText}
            </p>
            {prompt.text.length > 150 && (
              <Button
                variant="link"
                className="p-0 h-auto mt-1 text-xs"
                onClick={() => setShowFullText(!showFullText)}
              >
                {showFullText ? "Show less" : "Show more"}
              </Button>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex-wrap gap-2 justify-between">
          <div className="flex flex-wrap gap-1">
            {prompt.tags?.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddToMyPrompts}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Save to My Collection
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Add to My Prompts Dialog */}
      <AddToMyPromptsDialog
        open={isAddingToPrompts}
        onOpenChange={setIsAddingToPrompts}
        prompt={prompt}
      />
    </>
  );
};

export default SpotlightPromptCard;
