
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePrompts } from '@/hooks/use-prompts';
import { useCategories } from '@/hooks/use-categories';
import { useAuth } from '@/contexts/AuthContext';
import { Prompt } from '@/lib/supabase';
import { Search, Filter, X, Loader2, Grid, List } from 'lucide-react';
import PromptCard from '@/components/PromptCard';
import PromptListItem from '@/components/PromptListItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import PromptForm from '@/components/PromptForm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SEO from '@/components/SEO';

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const savedViewMode = localStorage.getItem('promptCommunityViewMode');
    return savedViewMode === 'list' ? 'list' : 'grid';
  });

  // Fetch categories for filter dropdown
  const { categories } = useCategories();

  // Fetch public prompts
  const {
    prompts: allPrompts,
    loading,
    updatePrompt,
    deletePrompt,
    createPrompt,
  } = usePrompts(
    selectedCategory === 'All' ? undefined : selectedCategory,
    searchTerm,
    activeTags.length > 0 ? activeTags : undefined
  );

  // Filter to only public prompts
  const publicPrompts = allPrompts.filter(prompt => prompt.is_public);

  // Extract unique tags from all public prompts
  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    
    publicPrompts.forEach(prompt => {
      if (prompt.tags) {
        prompt.tags.forEach(tag => tagsSet.add(tag.toLowerCase()));
      }
    });
    
    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
  }, [publicPrompts]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle category selection
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  // Toggle tag selection for filtering
  const toggleTag = (tag: string) => {
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

  // Toggle view mode between grid and list
  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    localStorage.setItem('promptCommunityViewMode', newMode);
  };

  // Handle edit prompt (only for the prompt owner)
  const handleEditPrompt = (prompt: Prompt) => {
    if (user && prompt.user_id === user.id) {
      setEditingPrompt(prompt);
      setIsDialogOpen(true);
    } else {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You can only edit your own prompts.",
      });
    }
  };

  // Handle delete prompt (only for the prompt owner)
  const handleDeletePrompt = async (id: string) => {
    const prompt = publicPrompts.find(p => p.id === id);
    
    if (!prompt) return;
    
    if (user && prompt.user_id === user.id) {
      await deletePrompt(id);
      toast({
        title: "Prompt deleted",
        description: "Your prompt has been removed from the community.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You can only delete your own prompts.",
      });
    }
  };

  // Handle saving someone else's prompt to your library
  const handleSaveToLibrary = async (prompt: Prompt) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to save prompts to your library.",
      });
      return;
    }

    if (prompt.user_id === user.id) {
      toast({
        description: "This is already your prompt.",
      });
      return;
    }

    // Clone the prompt without the id (will generate a new one)
    const { id, user_id, created_at, updated_at, ...promptData } = prompt;
    
    try {
      await createPrompt({
        ...promptData,
        title: `${promptData.title} (Saved)`,
        description: promptData.description 
          ? `${promptData.description} (Originally created by another user)`
          : 'Saved from community',
      });
      
      toast({
        title: "Prompt saved to your library",
        description: "You can now edit and customize it.",
      });
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast({
        variant: "destructive",
        title: "Failed to save prompt",
        description: "Please try again later.",
      });
    }
  };

  // Handle update prompt submission
  const handleUpdatePrompt = async (values: Omit<Prompt, 'id' | 'created_at' | 'user_id' | 'updated_at'>) => {
    if (editingPrompt) {
      await updatePrompt(editingPrompt.id, values);
      setIsDialogOpen(false);
      setEditingPrompt(null);
    }
  };

  // Render prompts based on view mode
  const renderPrompts = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading prompts...</p>
        </div>
      );
    }

    if (publicPrompts.length === 0) {
      return (
        <div className="text-center py-16 bg-muted/30 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">No prompts found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || selectedCategory !== 'All' || activeTags.length > 0
              ? "No prompts match your search filters."
              : "There are no public prompts in the community yet."}
          </p>
          {searchTerm || selectedCategory !== 'All' || activeTags.length > 0 ? (
            <Button onClick={clearFilters}>Clear filters</Button>
          ) : (
            <Button onClick={() => navigate('/create')}>
              Create the first community prompt
            </Button>
          )}
        </div>
      );
    }

    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicPrompts.map(prompt => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onEdit={handleEditPrompt}
              onDelete={handleDeletePrompt}
              className="h-full"
            />
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col space-y-4">
        {publicPrompts.map(prompt => (
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <SEO 
        title="Community Prompts | Promptiverse"
        description="Discover and save public prompts from the community."
      />
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Community Prompts</h1>
        <Button
          onClick={() => navigate('/create')}
          className="button-hover hidden sm:flex"
        >
          Share Your Prompt
        </Button>
      </div>

      {/* Mobile button */}
      <div className="sm:hidden mb-4">
        <Button
          onClick={() => navigate('/create')}
          className="w-full"
        >
          Share Your Prompt
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
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
                {categories.map((category) => (
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
              <h3 className="text-sm font-medium">Filter by Tags</h3>
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

      {/* Main content */}
      {renderPrompts()}

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

export default CommunityPage;
