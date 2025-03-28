
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import SEO from '@/components/SEO';
import CategoryManager from '@/components/CategoryManager';
import { useCategories } from '@/hooks/use-categories';
import LoginPrompt from '@/components/LoginPrompt';

const CategoryManagementPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    categories, 
    isLoading, 
    addCategory, 
    updateCategory, 
    deleteCategory 
  } = useCategories();
  
  if (!isAuthenticated) {
    return <LoginPrompt message="Log in to manage prompt categories" onClose={() => navigate('/')} />;
  }

  return (
    <div className="container py-8">
      <SEO 
        title="Manage Categories" 
        description="Manage your prompt categories" 
      />
      
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Manage Categories</h1>
      </div>
      
      <div className="max-w-3xl mx-auto">
        {isLoading ? (
          <div className="text-center py-8">Loading categories...</div>
        ) : (
          <CategoryManager
            categories={categories}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
          />
        )}
        
        <div className="mt-8 text-sm text-muted-foreground bg-muted p-4 rounded-md">
          <h3 className="font-medium mb-2">About Categories</h3>
          <p>Categories help you organize your prompts. Default categories cannot be deleted, but you can add custom categories to suit your needs.</p>
          <p className="mt-2">When you create a new prompt, you can assign it to any of these categories.</p>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagementPage;
