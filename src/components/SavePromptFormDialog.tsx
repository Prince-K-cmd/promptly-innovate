import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Prompt } from '@/lib/supabase';
import { usePrompts } from '@/hooks/use-prompts';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Library, RefreshCw } from 'lucide-react';
import { capitalizeTitle, generatePromptTitle } from '@/lib/utils/text-utils';

interface SavePromptFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoToLibrary: () => void;
  onStartNewPrompt: () => void;
  promptText: string;
  category: string;
  tone?: string;
  audience?: string;
  tags?: string[];
}

const SavePromptFormDialog: React.FC<SavePromptFormDialogProps> = ({
  open,
  onOpenChange,
  onGoToLibrary,
  onStartNewPrompt,
  promptText,
  category,
  tone,
  audience,
  tags = [],
}) => {
  const { createPrompt } = usePrompts();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Generate a title from the prompt text
  const generatedTitle = generatePromptTitle(promptText, category);
  
  // Form state
  const [title, setTitle] = useState(generatedTitle);
  const [isPublic, setIsPublic] = useState(false);
  
  // Reset the form when dialog opens
  React.useEffect(() => {
    if (open) {
      setTitle(generatedTitle);
      setIsPublic(false);
      setIsSaved(false);
    }
  }, [open, generatedTitle]);
  
  // Handle save prompt
  const handleSavePrompt = async () => {
    setIsSubmitting(true);
    try {
      // Create the prompt with capitalized title
      await createPrompt({
        title: capitalizeTitle(title),
        text: promptText,
        category: category || 'general',
        is_public: isPublic,
        tags: [category, tone, audience, ...tags].filter(Boolean) as string[],
        description: `Generated with Prompt Builder. Category: ${category}, Tone: ${tone || 'neutral'}, Audience: ${audience || 'general'}`
      });
      
      toast({
        title: "Prompt saved",
        description: "Your custom prompt has been saved to your library",
      });
      
      setIsSaved(true);
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        variant: "destructive",
        title: "Failed to save prompt",
        description: "An error occurred while saving your prompt",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {!isSaved ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Save Your Prompt</DialogTitle>
              <DialogDescription>
                Give your prompt a title and choose visibility settings
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Prompt Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    // Display capitalized version to the user
                    e.target.value = capitalizeTitle(e.target.value);
                  }}
                  placeholder="Enter a title for your prompt"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                />
                <div>
                  <Label htmlFor="is-public" className="cursor-pointer">Make this prompt public</Label>
                  <p className="text-sm text-muted-foreground">
                    Public prompts can be discovered by other users
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePrompt}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Prompt'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-center text-xl mt-4">
                Prompt Saved Successfully!
              </DialogTitle>
              <DialogDescription className="text-center">
                Your prompt has been saved. What would you like to do next?
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 w-full"
                onClick={onStartNewPrompt}
              >
                <RefreshCw className="h-4 w-4" />
                Start New Prompt
              </Button>
              <Button
                className="flex items-center justify-center gap-2 w-full"
                onClick={onGoToLibrary}
              >
                <Library className="h-4 w-4" />
                Go to Library
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SavePromptFormDialog;
