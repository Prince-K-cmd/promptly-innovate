import React, { useState } from 'react';
import {
  Card,
  CardDescription,
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
import { Copy, MoreHorizontal, Edit, Trash2, Lock, Globe, Heart } from 'lucide-react';
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

interface PromptListItemProps {
  prompt: Prompt;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const PromptListItem: React.FC<PromptListItemProps> = ({
  prompt,
  onEdit,
  onDelete,
  className
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [showFullText, setShowFullText] = useState(false);

  const isOwner = user?.id === prompt.user_id || prompt.user_id === 'local';
  const promptIsFavorite = isFavorite(prompt.id);
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

  // Format date with day of week
  const formattedDate = new Date(prompt.created_at).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Card className={cn("card-hover overflow-hidden flex flex-col md:flex-row", className)}>
      <div className="flex-grow p-4 md:p-6">
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

          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                promptIsFavorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={handleToggleFavorite}
            >
              <Heart className={cn("h-4 w-4", promptIsFavorite ? "fill-current" : "")} />
              <span className="sr-only">{promptIsFavorite ? "Remove from favorites" : "Add to favorites"}</span>
            </Button>

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy text
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this prompt. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="text-sm leading-relaxed whitespace-pre-wrap mt-2">
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
      </div>

      <div className="flex flex-wrap gap-2 p-4 md:p-6 md:border-l border-border md:min-w-[200px] bg-muted/10">
        <div className="w-full mb-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleCopy}
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copy
          </Button>
        </div>

        {prompt.tags?.map(tag => (
          <Badge
            key={tag}
            variant="secondary"
            className="px-2 py-0 text-xs h-5 rounded-sm font-normal"
          >
            {tag.toLowerCase()}
          </Badge>
        ))}
      </div>
    </Card>
  );
};

export default PromptListItem;
