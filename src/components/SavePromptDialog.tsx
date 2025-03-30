
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, BookCheck, RefreshCw } from 'lucide-react';

interface SavePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoToLibrary: () => void;
  onStartNewPrompt: () => void;
}

const SavePromptDialog: React.FC<SavePromptDialogProps> = ({
  open,
  onOpenChange,
  onGoToLibrary,
  onStartNewPrompt
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Check className="h-5 w-5 mr-2 text-green-500" />
            Prompt Saved Successfully
          </DialogTitle>
          <DialogDescription>
            Your prompt has been saved to your personal library.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            You can access your saved prompts in your library at any time, or start creating a new prompt now.
          </p>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={onStartNewPrompt}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Start New Prompt
          </Button>
          <Button
            onClick={onGoToLibrary}
            className="flex items-center gap-2"
          >
            <BookCheck className="h-4 w-4" />
            Go to Library
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SavePromptDialog;
