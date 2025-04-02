
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Prompt } from '@/lib/supabase';
import { Copy, Check, Edit, Trash2, PlusCircle, Lock, Globe, Heart, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import AddToMyPromptsDialog from './AddToMyPromptsDialog';
import { useFavorites } from '@/hooks/use-favorites';

interface CommunityPromptCardProps {
  prompt: Prompt;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const CommunityPromptCard: React.FC<CommunityPromptCardProps> = ({
  prompt,
  onEdit,
  onDelete,
  className
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [showFullText, setShowFullText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAddingToPrompts, setIsAddingToPrompts] = useState(false);

  // Check if the user is the owner of the prompt
  const isOwner = user?.id === prompt.user_id;
  
  // Check if prompt is a favorite
  const promptIsFavorite = user ? isFavorite(prompt.id) : false;

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
    
    if (isOwner) {
      toast({
        description: "This is already your prompt",
      });
      return;
    }
    
    setIsAddingToPrompts(true);
  };

  // Handle edit prompt (only for owner)
  const handleEdit = () => {
    if (isOwner && onEdit) {
      onEdit(prompt);
    } else {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You can only edit your own prompts",
      });
    }
  };

  // Handle delete prompt (only for owner)
  const handleDelete = () => {
    if (isOwner && onDelete) {
      onDelete(prompt.id);
    } else {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You can only delete your own prompts",
      });
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to save favorites",
      });
      return;
    }

    if (promptIsFavorite) {
      await removeFavorite(prompt.id);
    } else {
      await addFavorite(prompt.id);
    }
  };

  // Format date with day of week
  const formattedDate = new Date(prompt.created_at).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <>
      <Card className={cn("h-full flex flex-col", className)}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{prompt.title}</h3>
              <p className="text-sm text-muted-foreground">
                {formattedDate} • {prompt.category}
                {isOwner && (
                  <span className="ml-2 text-primary-foreground/70 bg-primary/20 px-2 py-0.5 rounded-full text-xs">
                    Your Prompt
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3 flex-grow">
          <div className="whitespace-pre-wrap text-sm">
            {showFullText ? prompt.text : truncatedText}
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

          {prompt.description && (
            <p className="text-muted-foreground text-sm mt-2">{prompt.description}</p>
          )}
        </CardContent>

        <CardFooter className="pt-0 flex-wrap gap-2 justify-between">
          <div className="flex flex-wrap gap-1">
            {prompt.tags?.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap justify-end mt-2">
            {!isOwner && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddToMyPrompts}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Save to My Collection
              </Button>
            )}

            {user && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleFavorite}
                className={cn(promptIsFavorite && "text-red-500 border-red-500")}
              >
                <Heart className={cn("h-4 w-4 mr-1", promptIsFavorite && "fill-red-500")} />
                {promptIsFavorite ? "Favorited" : "Favorite"}
              </Button>
            )}

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

            {isOwner && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEdit}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
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

export default CommunityPromptCard;
