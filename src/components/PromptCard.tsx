
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Prompt } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/use-favorites';
import { Copy, MoreHorizontal, Edit, Trash2, Lock, Globe, Heart, Share, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import SavePromptDialog from '@/components/SavePromptDialog';
import AddToMyPromptsDialog from '@/components/AddToMyPromptsDialog';

interface PromptCardProps {
  prompt: Prompt;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  onEdit,
  onDelete,
  className
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [showFullText, setShowFullText] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isAddingToMyPrompts, setIsAddingToMyPrompts] = useState(false);

  // Check if prompt is a favorite
  const promptIsFavorite = user ? isFavorite(prompt.id) : false;

  // Check if the user is owner of the prompt
  const isOwner = user?.id === prompt.user_id || prompt.user_id === 'local';

  const truncatedText = prompt.text.length > 150 ? `${prompt.text.substring(0, 150)}...` : prompt.text;

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.text);
    toast({
      title: "Copied to clipboard",
      description: "Prompt text has been copied to your clipboard.",
    });
  };

  // Handle edit prompt
  const handleEdit = () => {
    if (onEdit) onEdit(prompt);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (onDelete) onDelete(prompt.id);
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

  // Handle save to my prompts (for other users' prompts)
  const handleSaveToMyPrompts = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to save this prompt to your collection",
      });
      return;
    }

    // If it's the user's own prompt, show a message
    if (isOwner) {
      toast({
        description: "This is already your prompt.",
      });
      return;
    }

    setIsAddingToMyPrompts(true);
  };

  // Handle share prompt
  const handleShare = () => {
    setIsSharing(true);
  };

  // Handle close share dialog
  const handleCloseShareDialog = () => {
    setIsSharing(false);
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
      <Card className={cn("card-hover overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold">{prompt.title}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {formattedDate} • {prompt.category}
                {!prompt.is_public && (
                  <span className="inline-flex items-center ml-2 text-muted-foreground">
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </span>
                )}
                {prompt.is_public && (
                  <span className="inline-flex items-center ml-2 text-muted-foreground">
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </span>
                )}
              </CardDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Copy</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share className="mr-2 h-4 w-4" />
                  <span>Share</span>
                </DropdownMenuItem>
                {user && (
                  <DropdownMenuItem onClick={handleToggleFavorite}>
                    <Heart className={cn("mr-2 h-4 w-4", promptIsFavorite && "fill-red-500 text-red-500")} />
                    <span>{promptIsFavorite ? "Remove from favorites" : "Add to favorites"}</span>
                  </DropdownMenuItem>
                )}
                {!isOwner && user && (
                  <DropdownMenuItem onClick={handleSaveToMyPrompts}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>Save to my collection</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {(isOwner || prompt.user_id === 'local') && (
                  <>
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this prompt.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {showFullText ? prompt.text : truncatedText}
            {prompt.text.length > 150 && (
              <Button
                variant="link"
                className="px-0 text-xs font-normal h-auto"
                onClick={() => setShowFullText(!showFullText)}
              >
                {showFullText ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>

          {prompt.description && (
            <p className="text-sm text-muted-foreground mt-2">{prompt.description}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 pt-0">
          {prompt.tags?.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}

          <div className="flex-grow"></div>

          <div className="flex gap-2">
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFavorite}
                className={cn(promptIsFavorite && "text-red-500 border-red-500")}
              >
                <Heart className={cn("h-3.5 w-3.5 mr-1", promptIsFavorite && "fill-red-500")} />
                {promptIsFavorite ? "Favorited" : "Favorite"}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Sharing Dialog */}
      {isSharing && (
        <SavePromptDialog
          open={isSharing}
          onOpenChange={handleCloseShareDialog}
          onGoToLibrary={() => {
            handleCloseShareDialog();
            // Navigate to library implementation would go here
          }}
          onStartNewPrompt={() => {
            handleCloseShareDialog();
            // Start new prompt implementation would go here
          }}
        />
      )}

      {/* Add to My Prompts Dialog */}
      {isAddingToMyPrompts && (
        <AddToMyPromptsDialog
          open={isAddingToMyPrompts}
          onOpenChange={setIsAddingToMyPrompts}
          prompt={prompt}
        />
      )}
    </>
  );
};

export default PromptCard;
