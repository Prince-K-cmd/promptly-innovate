import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// UI components
import { usePrompts } from '@/hooks/use-prompts';
import { useCategories } from '@/hooks/use-categories';
import { Prompt } from '@/lib/supabase';
import PromptCard from '@/components/PromptCard';
import PromptListItem from '@/components/PromptListItem';
import PromptPagination from '@/components/PromptPagination';
import FeaturedPrompts from '@/components/FeaturedPrompts';
import TagCloud from '@/components/TagCloud';
import PromptSortSelect, { SortOption } from '@/components/PromptSortSelect';
import VirtualizedPromptList from '@/components/VirtualizedPromptList';
import KeyboardNavigableGrid from '@/components/KeyboardNavigableGrid';
import { ThemeToggle } from '@/contexts/ThemeContext';

import { Search, X, Grid, List, SlidersHorizontal, ArrowUp } from 'lucide-react';
import { useMediaQuery } from '../hooks/use-media-query';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

const CommunityPromptsPage: React.FC = () => {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    // Get saved preference or default to grid
    const savedMode = localStorage.getItem('promptiverse_view_mode');
    return savedMode === 'list' ? 'list' : 'grid';
  });

  // Get all available tags from prompts
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});

  // Refs for accessibility and scrolling
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Media query for responsive design (used for conditional rendering in the UI)
  const isDesktop = useMediaQuery('(min-width: 768px)');
  // We use isDesktop in the mobile filters section

  // Get categories
  const { categories } = useCategories();

  // Get community prompts with filters
  const {
    prompts,
    loading,
    pagination,
    deletePrompt
  } = usePrompts({
    category: selectedCategory === 'All' ? undefined : selectedCategory,
    searchTerm,
    tags: activeTags.length > 0 ? activeTags : undefined,
    filterType: 'community',
    page: currentPage,
    pageSize: 12
  });

  // Update available tags when prompts change
  useEffect(() => {
    if (prompts.length > 0) {
      const tags = new Set<string>();
      const counts: Record<string, number> = {};

      prompts.forEach(prompt => {
        if (prompt.tags) {
          prompt.tags.forEach(tag => {
            const lowerTag = tag.toLowerCase();
            tags.add(lowerTag);
            counts[lowerTag] = (counts[lowerTag] || 0) + 1;
          });
        }
      });

      // Sort tags by frequency (most used first) and then alphabetically for ties
      const sortedTags = Array.from(tags).sort((a, b) => {
        const countDiff = (counts[b] || 0) - (counts[a] || 0);
        return countDiff !== 0 ? countDiff : a.localeCompare(b, undefined, { sensitivity: 'base' });
      });

      setAvailableTags(sortedTags);
      setTagCounts(counts);

      // Log tag counts for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Tag counts:', counts);
      }
    }
  }, [prompts]);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('promptiverse_view_mode', viewMode);
  }, [viewMode]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, activeTags, sortOption]);

  // Scroll to results when page changes
  useEffect(() => {
    if (currentPage > 1 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentPage]);

  // Sort prompts based on selected sort option
  const sortedPrompts = [...prompts].sort((a, b) => {
    switch (sortOption) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      case 'popular':
        // For now, sort by public status and then by creation date
        // In a future enhancement, this could be based on views, saves, or likes
        if (a.is_public && !b.is_public) return -1;
        if (!a.is_public && b.is_public) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already applied via the useEffect dependency
    // Announce to screen readers that results are being updated
    const resultsCount = prompts.length;
    const announcement = `Searching for "${searchTerm}". ${resultsCount} results found.`;
    const ariaLive = document.getElementById('aria-live-announcer');
    if (ariaLive) {
      ariaLive.textContent = announcement;
    }
  };

  // Handle clearing search
  const handleClearSearch = () => {
    setSearchTerm('');
    // Focus back on the search input for better UX
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle tag selection
  const handleTagToggle = (tag: string) => {
    if (activeTags.includes(tag)) {
      setActiveTags(activeTags.filter(t => t !== tag));
    } else {
      setActiveTags([...activeTags, tag]);
    }
  };

  // Handle clearing all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setActiveTags([]);
  };

  // Handle scrolling to top
  const scrollToTop = () => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle prompt selection from keyboard navigation
  const handlePromptSelect = (index: number) => {
    if (index >= 0 && index < sortedPrompts.length) {
      // Open the prompt details or perform an action
      // For now, we'll just log it
      console.log('Selected prompt:', sortedPrompts[index]);
    }
  };

  // Handle edit prompt
  const handleEditPrompt = (prompt: Prompt) => {
    // Navigate to edit page
    window.location.href = `/edit/${prompt.id}`;
  };

  // Handle delete prompt
  const handleDeletePrompt = async (id: string) => {
    await deletePrompt(id);
  };

  // Render prompt list based on view mode
  const renderPromptList = (prompts: Prompt[]) => {
    // Use virtualized list for better performance with large collections
    if (prompts.length > 20) {
      return (
        <VirtualizedPromptList
          prompts={prompts}
          viewMode={viewMode}
        />
      );
    }

    // Use keyboard navigable grid for better accessibility with smaller collections
    if (viewMode === 'grid') {
      return (
        <KeyboardNavigableGrid
          columns={3}
          onItemSelect={handlePromptSelect}
          ariaLabel="Community prompts grid"
        >
          {prompts.map(prompt => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onEdit={handleEditPrompt}
              onDelete={handleDeletePrompt}
            />
          ))}
        </KeyboardNavigableGrid>
      );
    } else {
      return (
        <ul className="flex flex-col gap-4 list-none p-0" aria-label="Community prompts list">
          {prompts.map(prompt => (
            <li key={prompt.id} className="list-none">
              <PromptListItem
                prompt={prompt}
                onEdit={handleEditPrompt}
                onDelete={handleDeletePrompt}
              />
            </li>
          ))}
        </ul>
      );
    }
  };

  return (
    <div className="container py-8 max-w-7xl">
      {/* Hidden element for screen reader announcements */}
      <div
        id="aria-live-announcer"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      ></div>

      <div ref={topRef} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community Prompts</h1>
          <p className="text-muted-foreground mt-1">
            Discover and save prompts shared by the community
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Theme toggle */}
            <ThemeToggle className="h-9 w-9" />
          {/* Mobile filters button - only shown on mobile */}
          <Sheet>
            <SheetTrigger asChild className={isDesktop ? 'hidden' : 'block'}>
              <Button variant="outline" size="sm" className="h-9">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Filter community prompts by category and tags
                </SheetDescription>
              </SheetHeader>

              <div className="py-4 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="mobile-category">Category</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger id="mobile-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <ScrollArea className="h-[200px] rounded-md border p-2">
                    <div className="space-y-2">
                      {availableTags.map(tag => (
                        <div key={tag} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-mobile-${tag}`}
                            checked={activeTags.includes(tag)}
                            onCheckedChange={() => handleTagToggle(tag)}
                          />
                          <Label
                            htmlFor={`tag-mobile-${tag}`}
                            className="text-sm cursor-pointer"
                          >
                            {tag}
                          </Label>
                        </div>
                      ))}
                      {availableTags.length === 0 && (
                        <p className="text-sm text-muted-foreground">No tags available</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button>Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Search form */}
          <form onSubmit={handleSearch} className="relative flex-1 md:max-w-sm">
            <label htmlFor="search-input" className="sr-only">Search community prompts</label>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="search-input"
              ref={searchInputRef}
              type="search"
              placeholder="Search community prompts..."
              className="pl-8 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search community prompts"
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-9 px-2"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </form>

          {/* Sort options */}
          <PromptSortSelect
            value={sortOption}
            onChange={setSortOption}
            className="w-[180px] h-9"
          />

          {/* View mode toggle */}
          <fieldset className="flex border rounded-md" aria-label="View mode">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 px-2.5 rounded-none rounded-l-md",
                viewMode === 'grid' && "bg-muted"
              )}
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 px-2.5 rounded-none rounded-r-md",
                viewMode === 'list' && "bg-muted"
              )}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              aria-label="List view"
            >
              <List className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">List view</span>
            </Button>
          </fieldset>
        </div>
      </div>

      {/* Featured Prompts Section */}
      <div className="mb-8">
        <FeaturedPrompts limit={3} />
      </div>

      {/* Desktop filters */}
      <div className="hidden md:flex flex-wrap gap-4 mb-6">
        <div className="flex-1 max-w-xs">
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            aria-label="Filter by category"
          >
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <TagCloud
            tags={availableTags}
            selectedTags={activeTags}
            onTagSelect={handleTagToggle}
            onClearAll={() => setActiveTags([])}
            maxInitialTags={10}
            className="w-full"
          />
        </div>

        {(searchTerm || selectedCategory !== 'All' || activeTags.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="ml-auto"
          >
            Clear filters
            <X className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Active filters display - only shown on mobile */}
      {!isDesktop && (searchTerm || selectedCategory !== 'All' || activeTags.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: {searchTerm}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={handleClearSearch}
              />
            </Badge>
          )}

          {selectedCategory !== 'All' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {selectedCategory}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSelectedCategory('All')}
              />
            </Badge>
          )}

          {activeTags.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleTagToggle(tag)}
              />
            </Badge>
          ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-6 px-2"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Main content */}
      <div ref={resultsRef} className="mt-6" aria-live="polite">
        <h2 className="sr-only">Community Prompts Results</h2>
        {renderMainContent()}
      </div>
    </div>
  );

  // Helper function to render the main content based on loading and data state
  function renderMainContent() {
    // Show loading state
    if (loading) {
      return (
        <div className={cn(
          "grid gap-6",
          viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {Array.from({ length: 6 }).map((_, i) => {
            // Using a stable key pattern with a unique prefix
            const placeholderId = `loading-placeholder-${i}`;
            return (
              <div
                key={placeholderId}
                className={cn(
                  "rounded-lg bg-muted animate-pulse",
                  viewMode === 'grid' ? "h-64" : "h-24"
                )}
              />
            );
          })}
        </div>
      );
    }

    // Show prompts if we have any
    if (sortedPrompts.length > 0) {
      return (
        <>
          {renderPromptList(sortedPrompts)}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <PromptPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}

          {/* Back to top button */}
          {pagination && pagination.currentPage > 1 && (
            <div className="fixed bottom-6 right-6 z-10">
              <Button
                size="icon"
                className="rounded-full shadow-lg"
                onClick={scrollToTop}
                aria-label="Scroll to top"
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            </div>
          )}
        </>
      );
    }

    // Show empty state
    return (
      <div className="text-center py-16 bg-muted/30 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">No community prompts found</h3>
        <p className="text-muted-foreground mb-6">
          {searchTerm || selectedCategory !== 'All' || activeTags.length > 0
            ? "Try adjusting your filters or search terms"
            : "Check back later for community contributions"}
        </p>
        {(searchTerm || selectedCategory !== 'All' || activeTags.length > 0) && (
          <Button onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    );
  }
};

export default CommunityPromptsPage;
