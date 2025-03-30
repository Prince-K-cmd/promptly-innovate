
import React, { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePrompts } from '@/hooks/use-prompts';
import { useFavorites } from '@/hooks/use-favorites';
import { useCategories } from '@/hooks/use-categories';
import PromptCard from '@/components/PromptCard';
import PromptListItem from '@/components/PromptListItem';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import PromptForm from '@/components/PromptForm';
import { Prompt, Category } from '@/lib/supabase';
import { Search, PlusCircle, Filter, X, Loader2, Settings, Heart, Grid, List } from 'lucide-react';
import { eventEmitter, EVENTS } from '@/lib/events';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Helper function to render prompts in grid or list view
const renderPromptList = (
  prompts: Prompt[],
  viewMode: 'grid' | 'list',
  handleEditPrompt: (prompt: Prompt) => void,
  handleDeletePrompt: (id: string) => void
): ReactNode => {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prompts.map(prompt => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onEdit={handleEditPrompt}
            onDelete={handleDeletePrompt}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {prompts.map(prompt => (
        <PromptListItem
          key={prompt.id}
          prompt={prompt}
          onEdit={handleEditPrompt}
          onDelete={handleDeletePrompt}
        />
      ))}
    </div>
  );
};

// Helper function to render empty state message
const renderEmptyState = (
  title: string,
  message: ReactNode,
  navigate: (path: string) => void
): ReactNode => {
  return (
    <div className="text-center py-16 bg-muted/30 rounded-lg">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{message}</p>
      <Button onClick={() => navigate('/create')}>
        <PlusCircle className="mr-2 h-5 w-5" />
        Create a Prompt
      </Button>
    </div>
  );
};

const LibraryPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    // Try to get the saved view mode from localStorage
    const savedViewMode = localStorage.getItem('promptLibraryViewMode');
    return savedViewMode === 'list' ? 'list' : 'grid';
  });

  // Get categories
  const { categories } = useCategories();

  // Get prompts based on filters
  const {
    prompts,
    loading,
    updatePrompt,
    deletePrompt,
  } = usePrompts(
    selectedCategory === 'All' ? undefined : selectedCategory,
    searchTerm,
    activeTags.length > 0 ? activeTags : undefined
  );

  // Get favorites
  const { favorites, loading: favoritesLoading, fetchFavorites } = useFavorites();

  // Listen for favorites changes
  useEffect(() => {
    // Set up event listener for favorites changes
    const unsubscribe = eventEmitter.on(EVENTS.FAVORITES_CHANGED, () => {
      console.log('Favorites changed event received, refreshing favorites');
      fetchFavorites();
    });

    // Clean up event listener on unmount
    return () => {
      unsubscribe();
    };
  }, [fetchFavorites]);

  // Filter prompts that are in favorites with the same filters applied
  const favoritePrompts = React.useMemo(() => {
    if (favorites.length === 0) return [];

    // Extract favorite prompt IDs
    const favoriteIds = favorites.map(fav => fav.prompt_id);

    // Start with all prompts that match favorite IDs
    let filtered = prompts.filter(prompt => favoriteIds.includes(prompt.id));

    // Apply the same filters as the main tab
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(prompt => prompt.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(prompt =>
        prompt.title?.toLowerCase().includes(term) ||
        prompt.text?.toLowerCase().includes(term) ||
        prompt.description?.toLowerCase().includes(term)
      );
    }

    if (activeTags.length > 0) {
      filtered = filtered.filter(prompt => {
        if (!prompt.tags) return false;

        // Convert all prompt tags to lowercase for case-insensitive comparison
        const lowercaseTags = prompt.tags.map(tag => tag.toLowerCase());

        // Check if all active tags are included in the prompt's tags
        return activeTags.every(tag => lowercaseTags.includes(tag));
      });
    }

    return filtered;
  }, [prompts, favorites, selectedCategory, searchTerm, activeTags]);

  // Get unique tags from prompts based on current tab
  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();

    // Use different prompt sets based on the current tab
    const promptsToUse = currentTab === 'favorites' ? favoritePrompts : prompts;

    promptsToUse.forEach(prompt => {
      if (prompt.tags) {
        // Convert all tags to lowercase for consistency
        prompt.tags.forEach(tag => tagsSet.add(tag.toLowerCase()));
      }
    });

    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
  }, [prompts, favoritePrompts, currentTab]);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle category selection
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  // Handle tag toggle
  const toggleTag = (tag: string) => {
    // Convert tag to lowercase for consistency
    const lowercaseTag = tag.toLowerCase();

    if (activeTags.includes(lowercaseTag)) {
      setActiveTags(activeTags.filter(t => t !== lowercaseTag));
    } else {
      setActiveTags([...activeTags, lowercaseTag]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setActiveTags([]);
  };

  // Handle edit prompt
  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsDialogOpen(true);
  };

  // Handle delete prompt
  const handleDeletePrompt = async (id: string) => {
    await deletePrompt(id);
  };

  // Handle update prompt
  const handleUpdatePrompt = async (values: Omit<Prompt, 'id' | 'created_at' | 'user_id' | 'updated_at'>) => {
    if (editingPrompt) {
      await updatePrompt(editingPrompt.id, values);
      setIsDialogOpen(false);
      setEditingPrompt(null);
    }
  };

  // Toggle view mode between grid and list
  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    // Save preference to localStorage
    localStorage.setItem('promptLibraryViewMode', newMode);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };


  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Prompt Library</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate('/categories')}
            className="hidden sm:flex"
          >
            <Settings className="mr-2 h-5 w-5" />
            Manage Categories
          </Button>
          <Button onClick={() => navigate('/create')} className="button-hover">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Prompt
          </Button>
        </div>
      </div>

      {/* Mobile categories button */}
      <div className="sm:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => navigate('/categories')}
          className="w-full"
        >
          <Settings className="mr-2 h-5 w-5" />
          Manage Categories
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="all">All Prompts</TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            Favorites
          </TabsTrigger>
        </TabsList>

        {/* Search and Filters - Shared across tabs */}
        <div className="mb-8 space-y-4 mt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prompts..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-muted/40 rounded-lg p-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={toggleViewMode}
                      >
                        <Grid className="h-4 w-4" />
                        <span className="sr-only">Grid view</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Grid view</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={toggleViewMode}
                      >
                        <List className="h-4 w-4" />
                        <span className="sr-only">List view</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">List view</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <h3 className="text-sm font-medium">
                  {currentTab === 'favorites' ? 'Filter Favorites by Tags' : 'Filter by Tags'}
                </h3>
                {activeTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="ml-auto h-7 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={activeTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer py-1"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    {activeTags.includes(tag) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Current filter summary */}
          {(searchTerm || selectedCategory !== 'All' || activeTags.length > 0) && (
            <div className="bg-muted/20 p-3 rounded-lg text-sm">
              <div className="flex items-center">
                <span className="text-muted-foreground mr-2">Active filters:</span>
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <Badge variant="secondary" className="text-xs">
                      Search: {searchTerm}
                    </Badge>
                  )}
                  {selectedCategory !== 'All' && (
                    <Badge variant="secondary" className="text-xs">
                      Category: {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                    </Badge>
                  )}
                  {activeTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      Tag: {tag}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto h-7 text-xs"
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <TabsContent value="all">
          {(() => {
            // Loading state
            if (loading) {
              return (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground">Loading prompts...</p>
                </div>
              );
            }

            // Has prompts
            if (prompts.length > 0) {
              return renderPromptList(prompts, viewMode, handleEditPrompt, handleDeletePrompt);
            }

            // No prompts found
            const noPromptsMessage = searchTerm || selectedCategory !== 'All' || activeTags.length > 0 ? (
              <>
                No prompts match your search filters.
                <Button variant="link" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </>
            ) : (
              "Create your first prompt to get started!"
            );

            return renderEmptyState("No prompts found", noPromptsMessage, navigate);
          })()}
        </TabsContent>

        <TabsContent value="favorites">
          {(() => {
            // Loading state
            if (favoritesLoading) {
              return (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground">Loading favorites...</p>
                </div>
              );
            }

            // Has favorite prompts
            if (favoritePrompts.length > 0) {
              return renderPromptList(favoritePrompts, viewMode, handleEditPrompt, handleDeletePrompt);
            }

            // No favorites found
            const noFavoritesTitle = searchTerm || selectedCategory !== 'All' || activeTags.length > 0
              ? "No favorites match your filters"
              : "No favorite prompts yet";

            const noFavoritesMessage = searchTerm || selectedCategory !== 'All' || activeTags.length > 0 ? (
              <>
                Try different filters or <Button variant="link" className="px-0 py-0 h-auto" onClick={clearFilters}>clear all filters</Button>.
              </>
            ) : (
              "Add prompts to your favorites by clicking the heart icon."
            );

            return renderEmptyState(noFavoritesTitle, noFavoritesMessage, navigate);
          })()}
        </TabsContent>
      </Tabs>

      {/* Edit Prompt Dialog */}
      {editingPrompt && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Edit Prompt</h2>
            <PromptForm
              onSubmit={handleUpdatePrompt}
              initialValues={editingPrompt}
              isEdit
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LibraryPage;
