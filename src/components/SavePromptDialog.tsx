import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Library, RefreshCw } from 'lucide-react';

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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <AlertDialogTitle className="text-center text-xl mt-4">
            Prompt Saved Successfully!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your prompt has been saved to your library. What would you like to do next?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SavePromptDialog;
