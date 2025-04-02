import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagCloudProps {
  tags: string[];
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
  onClearAll?: () => void;
  maxInitialTags?: number;
  className?: string;
}

const TagCloud: React.FC<TagCloudProps> = ({
  tags,
  selectedTags,
  onTagSelect,
  onClearAll,
  maxInitialTags = 15,
  className
}) => {
  const [expanded, setExpanded] = useState(false);
  const [visibleTags, setVisibleTags] = useState<string[]>([]);
  const [hiddenTagsCount, setHiddenTagsCount] = useState(0);
  
  // Update visible tags when tags or expanded state changes
  useEffect(() => {
    if (expanded || tags.length <= maxInitialTags) {
      setVisibleTags(tags);
      setHiddenTagsCount(0);
    } else {
      setVisibleTags(tags.slice(0, maxInitialTags));
      setHiddenTagsCount(tags.length - maxInitialTags);
    }
  }, [tags, expanded, maxInitialTags]);
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  // Handle tag selection
  const handleTagClick = (tag: string) => {
    onTagSelect(tag);
  };
  
  // Clear all selected tags
  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    }
  };
  
  if (tags.length === 0) {
    return null;
  }
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Popular Tags</h3>
        {selectedTags.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearAll}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {visibleTags.map(tag => (
          <Badge
            key={tag}
            variant={selectedTags.includes(tag) ? "default" : "outline"}
            className={cn(
              "cursor-pointer tag-cloud-item",
              selectedTags.includes(tag) ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
            )}
            onClick={() => handleTagClick(tag)}
          >
            {tag}
            {selectedTags.includes(tag) && (
              <X className="ml-1 h-3 w-3" />
            )}
          </Badge>
        ))}
        
        {hiddenTagsCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleExpanded}
            className="text-xs h-6 px-2 rounded-full"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                +{hiddenTagsCount} more
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TagCloud;
