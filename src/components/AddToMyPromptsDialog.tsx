import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Prompt } from '@/lib/supabase';
import PromptForm from '@/components/PromptForm';
import { usePrompts } from '@/hooks/use-prompts';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

// Type for form values based on what createPrompt expects
type PromptFormValues = Omit<Prompt, 'id' | 'created_at' | 'user_id' | 'updated_at'>;

interface AddToMyPromptsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: Prompt;
}

const AddToMyPromptsDialog: React.FC<AddToMyPromptsDialogProps> = ({
  open,
  onOpenChange,
  prompt,
}) => {
  const { createPrompt } = usePrompts();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Create a copy of the prompt for editing
  // Remove system-specific properties and prepare it for the user's collection
  const promptCopy = {
    ...prompt,
    title: prompt.title || 'Spotlight Prompt',
    id: undefined,
    user_id: undefined,
    created_at: undefined,
    updated_at: undefined,
    // Remove spotlight-specific tags
    tags: prompt.tags?.filter(tag => tag !== 'spotlight') || [],
  };

  // Handle save prompt
  const handleSavePrompt = async (values: PromptFormValues) => {
    setIsSubmitting(true);
    try {
      await createPrompt(values);
      toast({
        title: "Prompt added",
        description: "The prompt has been added to your library",
      });
      onOpenChange(false);
      navigate('/library');
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add prompt to your library",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Add Spotlight Prompt to My Collection
          </DialogTitle>
          <DialogDescription>
            You can customize this prompt before adding it to your personal collection.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <PromptForm
            onSubmit={handleSavePrompt}
            initialValues={promptCopy}
            isPending={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToMyPromptsDialog;
