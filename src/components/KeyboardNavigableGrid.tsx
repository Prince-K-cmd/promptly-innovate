import React, { useRef, useEffect, useState, KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KeyboardNavigableGridProps {
  children: ReactNode[];
  columns: number;
  className?: string;
  onItemSelect?: (index: number) => void;
  itemClassName?: string;
  focusedItemClassName?: string;
  ariaLabel?: string;
}

const KeyboardNavigableGrid: React.FC<KeyboardNavigableGridProps> = ({
  children,
  columns,
  className,
  onItemSelect,
  itemClassName = '',
  focusedItemClassName = 'ring-2 ring-primary',
  ariaLabel = 'Navigable grid'
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Reset item refs when children change
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, children.length);
  }, [children.length]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (focusedIndex === null && children.length > 0) {
      setFocusedIndex(0);
      return;
    }
    
    if (focusedIndex === null || children.length === 0) return;
    
    const rows = Math.ceil(children.length / columns);
    const currentRow = Math.floor(focusedIndex / columns);
    const currentCol = focusedIndex % columns;
    
    let newIndex = focusedIndex;
    
    switch (e.key) {
      case 'ArrowRight':
        if (currentCol < columns - 1 && focusedIndex < children.length - 1) {
          newIndex = focusedIndex + 1;
        }
        break;
      case 'ArrowLeft':
        if (currentCol > 0) {
          newIndex = focusedIndex - 1;
        }
        break;
      case 'ArrowDown':
        if (currentRow < rows - 1) {
          newIndex = Math.min(focusedIndex + columns, children.length - 1);
        }
        break;
      case 'ArrowUp':
        if (currentRow > 0) {
          newIndex = focusedIndex - columns;
        }
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = children.length - 1;
        break;
      case 'Enter':
      case ' ':
        if (onItemSelect) {
          onItemSelect(focusedIndex);
          e.preventDefault();
        }
        return;
      default:
        return;
    }
    
    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex);
      e.preventDefault();
      
      // Scroll item into view if needed
      if (itemRefs.current[newIndex]) {
        itemRefs.current[newIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  };
  
  // Focus the grid when tabbing to it
  const handleGridFocus = () => {
    if (focusedIndex === null && children.length > 0) {
      setFocusedIndex(0);
    }
  };
  
  // Handle blur
  const handleGridBlur = () => {
    // Keep the focused index for when the grid is focused again
  };
  
  return (
    <div
      ref={gridRef}
      className={cn("outline-none", className)}
      tabIndex={0}
      role="grid"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      onFocus={handleGridFocus}
      onBlur={handleGridBlur}
    >
      <div 
        className={cn(
          "grid",
          `grid-cols-1 md:grid-cols-${Math.min(columns, 2)} lg:grid-cols-${columns}`,
          "gap-6"
        )}
      >
        {children.map((child, index) => (
          <div
            key={index}
            ref={el => itemRefs.current[index] = el}
            className={cn(
              itemClassName,
              focusedIndex === index && focusedItemClassName,
              "outline-none transition-all duration-200"
            )}
            role="gridcell"
            tabIndex={-1}
            aria-selected={focusedIndex === index}
            onClick={() => {
              setFocusedIndex(index);
              if (onItemSelect) onItemSelect(index);
            }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeyboardNavigableGrid;
