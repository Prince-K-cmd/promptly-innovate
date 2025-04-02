import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CopyToClipboardProps extends Omit<ButtonProps, 'onClick'> {
  text: string;
  successMessage?: string;
  errorMessage?: string;
  showText?: boolean;
  tooltipText?: string;
  className?: string;
  iconClassName?: string;
}

const CopyToClipboard: React.FC<CopyToClipboardProps> = ({
  text,
  successMessage = 'Copied to clipboard!',
  errorMessage = 'Failed to copy to clipboard',
  showText = true,
  tooltipText = 'Copy to clipboard',
  className,
  iconClassName,
  children,
  ...props
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(text);
      
      // Show success state
      setCopied(true);
      
      // Show toast
      toast({
        title: 'Success',
        description: successMessage,
      });
      
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      
      // Show error toast
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className={className}
            {...props}
          >
            {copied ? (
              <Check className={cn("h-4 w-4", showText && "mr-2", iconClassName)} />
            ) : (
              <Copy className={cn("h-4 w-4", showText && "mr-2", iconClassName)} />
            )}
            {showText && (children || (copied ? 'Copied!' : 'Copy'))}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CopyToClipboard;
