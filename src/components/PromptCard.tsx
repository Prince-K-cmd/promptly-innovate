
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
import { Copy, MoreHorizontal, Edit, Trash2, Lock, Globe, Bookmark, BookmarkCheck, Share2 } from 'lucide-react';
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
import { useFavorites } from '@/hooks/use-favorites';
import { usePrompts } from '@/hooks/use-prompts';

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
  const { toggleFavorite, isFavorited } = useFavorites();
  const { sharePrompt } = usePrompts();
  const [showFullText, setShowFullText] = useState(false);
  
  const isLocalPrompt = prompt.user_id === 'local';
  const isOwner = user?.id === prompt.user_id || isLocalPrompt;
  const truncatedText = prompt.text.length > 150 ? `${prompt.text.substring(0, 150)}...` : prompt.text;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.text);
    toast({
      title: "Copied to clipboard",
      description: "Prompt text has been copied to your clipboard.",
    });
  };
  
  const handleEdit = () => {
    if (onEdit) onEdit(prompt);
  };
  
  const handleDeleteConfirm = () => {
    if (onDelete) onDelete(prompt.id);
  };
  
  const handleToggleFavorite = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to favorite prompts",
      });
      return;
    }
    await toggleFavorite(prompt.id);
  };
  
  const handleShare = async () => {
    try {
      await sharePrompt(prompt);
      toast({
        title: "Prompt shared",
        description: "A copy has been added to your prompts.",
      });
    } catch (error) {
      console.error("Error sharing prompt:", error);
    }
  };
  
  // Format date with day included
  const formattedDate = new Date(prompt.created_at).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  return (
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
          
          <div className="flex">
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 mr-1"
                onClick={handleToggleFavorite}
                title={isFavorited(prompt.id) ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorited(prompt.id) ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {isFavorited(prompt.id) ? "Remove from favorites" : "Add to favorites"}
                </span>
              </Button>
            )}
            
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
                  <Share2 className="mr-2 h-4 w-4" />
                  <span>Share</span>
                </DropdownMenuItem>
                
                {/* Allow editing and deleting for both owners and non-logged-in users */}
                <DropdownMenuSeparator />
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
        {prompt.tags && prompt.tags.map(tag => (
          <Badge key={tag} variant="secondary" className="text-xs font-normal">
            {tag}
          </Badge>
        ))}
        
        <div className="flex-grow"></div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-auto"
          onClick={handleCopy}
        >
          <Copy className="h-3.5 w-3.5 mr-1" />
          Copy
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PromptCard;
