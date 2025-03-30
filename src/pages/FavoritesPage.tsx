
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePrompts } from '@/hooks/use-prompts';
import { useFavorites } from '@/hooks/use-favorites';
import PromptCard from '@/components/PromptCard';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import PromptForm from '@/components/PromptForm';
import { Prompt } from '@/lib/supabase';
import { BookmarkCheck, Loader2, ArrowLeft } from 'lucide-react';

const FavoritesPage = () => {
  const navigate = useNavigate();
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Get all prompts and favorite info
  const { prompts, loading: promptsLoading, updatePrompt, deletePrompt } = usePrompts();
  const { favorites, loading: favoritesLoading } = useFavorites();
  
  // Filter prompts to only show favorites
  const favoritePrompts = prompts.filter(prompt => favorites.includes(prompt.id));
  
  const loading = promptsLoading || favoritesLoading;
  
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
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Favorite Prompts</h1>
      </div>
      
      <Separator className="mb-8" />
      
      {/* Prompts Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading favorites...</p>
        </div>
      ) : favoritePrompts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoritePrompts.map(prompt => (
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
          <BookmarkCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
          <p className="text-muted-foreground mb-6">
            Bookmark your favorite prompts to access them quickly.
          </p>
          <Button onClick={() => navigate('/library')}>
            Browse Prompts
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

export default FavoritesPage;
