
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Category } from '@/lib/supabase';

// Default categories for the application
export const DEFAULT_CATEGORIES = [
  { id: 'general', name: 'General', description: 'General purpose prompts' },
  { id: 'creative_writing', name: 'Creative Writing', description: 'Prompts for creative writing and storytelling' },
  { id: 'academic', name: 'Academic', description: 'Prompts for academic writing and research' },
  { id: 'business', name: 'Business', description: 'Prompts for business documents and communications' },
  { id: 'coding', name: 'Coding', description: 'Prompts for programming and development' },
  { id: 'marketing', name: 'Marketing', description: 'Prompts for marketing and advertising content' },
];

export function useCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // We're using a simple local approach for categories in this implementation
  // In a more complex app, you would store these in Supabase
  const getCategories = () => {
    // For now, return default categories from localStorage or defaults
    try {
      const savedCategories = localStorage.getItem('promptiverse_categories');
      if (savedCategories) {
        return JSON.parse(savedCategories) as Category[];
      }
    } catch (error) {
      console.error('Error retrieving categories:', error);
    }
    
    // If nothing in localStorage or parsing fails, return defaults
    return DEFAULT_CATEGORIES;
  };

  const saveCategories = (categories: Category[]) => {
    try {
      localStorage.setItem('promptiverse_categories', JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories:', error);
      throw error;
    }
  };

  // Query to get all categories
  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // Mutation to add a new category
  const addCategory = useMutation({
    mutationFn: async (newCategory: Omit<Category, 'id'>) => {
      const currentCategories = getCategories();
      const id = Date.now().toString(); // Simple ID generation
      
      const categoryToAdd: Category = {
        id,
        ...newCategory,
      };
      
      const updatedCategories = [...currentCategories, categoryToAdd];
      saveCategories(updatedCategories);
      
      return categoryToAdd;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Success',
        description: 'Category added successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to add category: ${error.message}`,
      });
    },
  });

  // Mutation to update a category
  const updateCategory = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Category> }) => {
      const currentCategories = getCategories();
      
      const updatedCategories = currentCategories.map(category => 
        category.id === id ? { ...category, ...updates } : category
      );
      
      saveCategories(updatedCategories);
      
      return updatedCategories.find(c => c.id === id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Success',
        description: 'Category updated successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update category: ${error.message}`,
      });
    },
  });

  // Mutation to delete a category
  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const currentCategories = getCategories();
      
      // Don't allow deleting default categories
      const isDefaultCategory = DEFAULT_CATEGORIES.some(c => c.id === id);
      if (isDefaultCategory) {
        throw new Error('Cannot delete default categories');
      }
      
      const updatedCategories = currentCategories.filter(category => category.id !== id);
      saveCategories(updatedCategories);
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete category: ${error.message}`,
      });
    },
  });

  return {
    categories,
    isLoading,
    error,
    addCategory: (category: Omit<Category, 'id'>) => addCategory.mutateAsync(category),
    updateCategory: (id: string, updates: Partial<Category>) => 
      updateCategory.mutateAsync({ id, updates }),
    deleteCategory: (id: string) => deleteCategory.mutateAsync(id),
  };
}
