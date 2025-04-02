import React, { useRef, useEffect, useState } from 'react';
import { Prompt } from '@/lib/supabase';
import PromptCard from './PromptCard';
import PromptListItem from './PromptListItem';
import { cn } from '@/lib/utils';

interface VirtualizedPromptListProps {
  prompts: Prompt[];
  viewMode: 'grid' | 'list';
  className?: string;
}

const VirtualizedPromptList: React.FC<VirtualizedPromptListProps> = ({
  prompts,
  viewMode,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [containerHeight, setContainerHeight] = useState(0);
  
  // Item heights (approximate)
  const itemHeight = viewMode === 'grid' ? 320 : 120; // px
  const bufferSize = 5; // Number of items to render above and below the visible area
  
  // Calculate the number of columns based on container width
  const [columns, setColumns] = useState(3);
  
  // Update columns on resize
  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      if (width < 640) {
        setColumns(1);
      } else if (width < 1024) {
        setColumns(2);
      } else {
        setColumns(3);
      }
    };
    
    updateColumns();
    
    const resizeObserver = new ResizeObserver(updateColumns);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);
  
  // Update visible range on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const scrollTop = window.scrollY;
      const containerTop = containerRef.current.offsetTop;
      const viewportHeight = window.innerHeight;
      
      // Calculate visible range
      const visibleTop = Math.max(0, scrollTop - containerTop);
      const visibleBottom = visibleTop + viewportHeight;
      
      // Calculate item indices
      let startIndex = Math.floor(visibleTop / itemHeight) * (viewMode === 'grid' ? columns : 1);
      let endIndex = Math.ceil(visibleBottom / itemHeight) * (viewMode === 'grid' ? columns : 1);
      
      // Add buffer
      startIndex = Math.max(0, startIndex - bufferSize * (viewMode === 'grid' ? columns : 1));
      endIndex = Math.min(prompts.length, endIndex + bufferSize * (viewMode === 'grid' ? columns : 1));
      
      setVisibleRange({ start: startIndex, end: endIndex });
    };
    
    // Calculate container height
    const totalRows = viewMode === 'grid' 
      ? Math.ceil(prompts.length / columns)
      : prompts.length;
    
    setContainerHeight(totalRows * itemHeight);
    
    // Initial calculation
    handleScroll();
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prompts.length, itemHeight, columns, viewMode, bufferSize]);
  
  // Visible prompts
  const visiblePrompts = prompts.slice(visibleRange.start, visibleRange.end);
  
  return (
    <div 
      ref={containerRef} 
      className={cn("relative", className)}
      style={{ height: `${containerHeight}px` }}
      aria-label={`${prompts.length} prompts in ${viewMode} view`}
    >
      <div 
        className={cn(
          "absolute top-0 left-0 right-0",
          viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"
        )}
        style={{ 
          transform: `translateY(${Math.floor(visibleRange.start / (viewMode === 'grid' ? columns : 1)) * itemHeight}px)` 
        }}
      >
        {visiblePrompts.map(prompt => (
          viewMode === 'grid' ? (
            <PromptCard 
              key={prompt.id} 
              prompt={prompt} 
              className="h-full"
            />
          ) : (
            <PromptListItem 
              key={prompt.id} 
              prompt={prompt} 
            />
          )
        ))}
      </div>
    </div>
  );
};

export default VirtualizedPromptList;
