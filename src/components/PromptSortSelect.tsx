import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';

export type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'popular';

interface PromptSortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
}

const PromptSortSelect: React.FC<PromptSortSelectProps> = ({
  value,
  onChange,
  className
}) => {
  return (
    <Select value={value} onValueChange={(val) => onChange(val as SortOption)}>
      <SelectTrigger className={className}>
        <div className="flex items-center">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Sort by" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">
          Newest First
        </SelectItem>
        <SelectItem value="oldest">
          Oldest First
        </SelectItem>
        <SelectItem value="alphabetical">
          Alphabetical (A-Z)
        </SelectItem>
        <SelectItem value="popular">
          Most Popular
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default PromptSortSelect;
