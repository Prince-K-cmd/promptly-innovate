import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { useSavedPrompts } from '@/hooks/use-saved-prompts';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Prompt } from '@/lib/supabase';
import EditBeforeSaveDialog from './EditBeforeSaveDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SaveToCollectionButtonProps extends Omit<ButtonProps, 'onClick'> {
  promptId: string;
  prompt?: Prompt; // Optional full prompt object for edit mode
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  className?: string;
  enableEditMode?: boolean; // Whether to enable edit mode before saving
}

const SaveToCollectionButton: React.FC<SaveToCollectionButtonProps> = ({
  promptId,
  prompt,
  variant = 'outline',
  size = 'sm',
  showText = true,
  className,
  enableEditMode = false,
  ...props
}) => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const { isSaved, savePrompt, saveEditedPrompt, removeSavedPrompt, loading } = useSavedPrompts();
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Check if this is a spotlight prompt
  const isSpotlightPrompt = promptId.startsWith('spotlight-');

  // Determine if edit mode should be used
  const shouldUseEditMode = enableEditMode || isSpotlightPrompt;

  // Check if the prompt is already saved
  const isPromptSaved = isSaved(promptId);

  // Get the full prompt object if not provided
  const getPromptData = (): Prompt | null => {
    if (prompt) return prompt;

    // For spotlight prompts, get from localStorage
    if (isSpotlightPrompt) {
      const spotlightCache = localStorage.getItem('promptiverse_spotlight_prompt');
      if (spotlightCache) {
        try {
          const parsedCache = JSON.parse(spotlightCache);
          if (parsedCache.prompt && parsedCache.prompt.id === promptId) {
            return parsedCache.prompt;
          }
        } catch (e) {
          console.error('Error parsing spotlight cache:', e);
        }
      }
    }

    return null;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'Please sign in to save prompts to your collection',
      });
      return;
    }

    if (isPromptSaved) {
      removeSavedPrompt(promptId);
    } else if (shouldUseEditMode) {
      // Get the prompt data
      const promptData = getPromptData();
      if (!promptData) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not retrieve prompt data for editing',
        });
        return;
      }

      // Show edit dialog
      setShowEditDialog(true);
    } else {
      // Save directly without editing
      savePrompt(promptId);
    }
  };

  // Handle saving edited prompt
  const handleSaveEdited = (editedPrompt: Partial<Prompt>) => {
    const promptData = getPromptData();
    if (!promptData) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not retrieve prompt data for saving',
      });
      setShowEditDialog(false);
      return;
    }

    // Save the edited prompt
    saveEditedPrompt(promptId, {
      ...promptData,
      ...editedPrompt,
      user_id: user?.id || 'anonymous'
    });

    // Close the dialog
    setShowEditDialog(false);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={handleClick}
              className={cn(
                isPromptSaved && "text-primary border-primary",
                className
              )}
              disabled={loading}
              {...props}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPromptSaved ? (
                <BookmarkCheck className={cn("h-4 w-4", showText && "mr-2")} />
              ) : (
                <Bookmark className={cn("h-4 w-4", showText && "mr-2")} />
              )}
              {showText && (isPromptSaved ? "Saved" : "Save")}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isPromptSaved ? "Remove from collection" : "Save to my collection"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Edit Dialog */}
      {shouldUseEditMode && showEditDialog && (
        <EditBeforeSaveDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          prompt={getPromptData() as Prompt}
          onSave={handleSaveEdited}
          loading={loading}
        />
      )}
    </>
  );
};

export default SaveToCollectionButton;
