import React from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { 
  Copy, 
  Check, 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Mail, 
  MessageCircle,
  Link as LinkIcon
} from 'lucide-react';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  text: string;
  url?: string;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onOpenChange,
  title,
  text,
  url = window.location.href,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const titleId = React.useId();
  
  // Generate share URLs
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(text.substring(0, 280)); // Twitter limit
  const encodedUrl = encodeURIComponent(url);
  
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%0A${encodedText}%0A${encodedUrl}`,
  };
  
  // Handle copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "Link copied",
      description: "The link has been copied to your clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Handle share to platform
  const handleShare = (platform: keyof typeof shareUrls) => {
    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-labelledby={titleId}>
        <DialogHeader>
          <DialogTitle id={titleId} className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Prompt
          </DialogTitle>
          <DialogDescription>
            Share this prompt with others via social media or direct link.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 mt-2">
          <div className="grid flex-1 gap-2">
            <Input
              value={url}
              readOnly
              className="w-full"
            />
          </div>
          <Button 
            type="button" 
            size="icon" 
            onClick={handleCopyLink}
            className="px-3"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Copy link</span>
          </Button>
        </div>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-3">Share to:</h4>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => handleShare('twitter')}
            >
              <Twitter className="h-4 w-4 text-[#1DA1F2]" />
              Twitter
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => handleShare('facebook')}
            >
              <Facebook className="h-4 w-4 text-[#1877F2]" />
              Facebook
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => handleShare('linkedin')}
            >
              <Linkedin className="h-4 w-4 text-[#0A66C2]" />
              LinkedIn
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => handleShare('email')}
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => handleShare('whatsapp')}
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              WhatsApp
            </Button>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button 
            variant="secondary" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
