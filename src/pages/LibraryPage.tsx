
import React, { useState, useEffect } from 'react';
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
import { usePrompts } from '@/hooks/use-prompts';
import { useCategories } from '@/hooks/use-categories';
import PromptCard from '@/components/PromptCard';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import PromptForm from '@/components/PromptForm';
import { Prompt } from '@/lib/supabase';
import { Search, PlusCircle, Filter, X, Loader2, Settings } from 'lucide-react';

const LibraryPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Get categories
  const { categories } = useCategories();
  
  // Get prompts based on filters
  const {
    prompts,
    loading,
    createPrompt,
    updatePrompt,
    deletePrompt,
    refreshPrompts
  } = usePrompts(
    selectedCategory === 'All' ? undefined : selectedCategory,
    searchTerm,
    activeTags.length > 0 ? activeTags : undefined
  );
  
  // Get unique tags from prompts
  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    prompts.forEach(prompt => {
      if (prompt.tags) {
        prompt.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [prompts]);
  
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
    if (activeTags.includes(tag)) {
      setActiveTags(activeTags.filter(t => t !== tag));
    } else {
      setActiveTags([...activeTags, tag]);
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
  const handleUpdatePrompt = async (values: any) => {
    if (editingPrompt) {
      await updatePrompt(editingPrompt.id, values);
      setIsDialogOpen(false);
      setEditingPrompt(null);
    }
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
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-[200px]">
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
      </div>
      
      {/* Prompts Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading prompts...</p>
        </div>
      ) : prompts.length > 0 ? (
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
      ) : (
        <div className="text-center py-16 bg-muted/30 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">No prompts found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || selectedCategory !== 'All' || activeTags.length > 0 ? (
              <>
                No prompts match your search filters.
                <Button variant="link" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </>
            ) : (
              "Create your first prompt to get started!"
            )}
          </p>
          <Button onClick={() => navigate('/create')}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Create a Prompt
          </Button>
        </div>
      )}
      
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
