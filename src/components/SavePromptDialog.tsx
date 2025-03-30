
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Library, RefreshCw, Share2 } from 'lucide-react';

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
  onStartNewPrompt,
}) => {
  const titleId = React.useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-labelledby={titleId}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle id={titleId} className="text-center text-xl mt-4">
            Prompt Shared Successfully!
          </DialogTitle>
          <DialogDescription className="text-center">
            Your prompt has been shared. What would you like to do next?
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
      </DialogContent>
    </Dialog>
  );
};

export default SavePromptDialog;
