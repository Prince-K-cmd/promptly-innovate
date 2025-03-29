
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Prompt } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/use-categories';
import { X } from 'lucide-react';

interface PromptFormProps {
  onSubmit: (values: any) => Promise<void>;
  initialValues?: Partial<Prompt>;
  isEdit?: boolean;
  isPending?: boolean;
}

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  text: z.string().min(10, 'Prompt text must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().optional(),
  is_public: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

const PromptForm: React.FC<PromptFormProps> = ({ 
  onSubmit, 
  initialValues = {}, 
  isEdit = false,
  isPending = false
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Prepare default values
  const defaultValues = {
    title: initialValues.title || '',
    text: initialValues.text || '',
    category: initialValues.category || '',
    description: initialValues.description || '',
    is_public: initialValues.is_public !== undefined ? initialValues.is_public : false,
    tags: initialValues.tags || [],
  };
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  // Add a tag
  const addTag = () => {
    const normalizedTag = tagInput.trim().toLowerCase();
    if (normalizedTag && !form.getValues('tags')?.includes(normalizedTag)) {
      const currentTags = form.getValues('tags') || [];
      form.setValue('tags', [...currentTags, normalizedTag]);
      setTagInput('');
    }
  };
  
  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle tag input keydown
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };
  
  // Handle form submission
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      if (!isEdit) {
        form.reset();
        toast({
          title: 'Success!',
          description: 'Your prompt has been created',
        });
        navigate('/library');
      } else {
        toast({
          title: 'Success!',
          description: 'Prompt updated successfully',
        });
      }
    } catch (error) {
      console.error('Error submitting prompt:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save prompt. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter a title for your prompt" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief description of the prompt" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt Text</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter your prompt text here..." 
                  className="min-h-[200px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <FormLabel>Tags (Optional)</FormLabel>
          <div className="flex">
            <Input
              placeholder="Add tags (press Enter or comma)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => tagInput.trim() && addTag()}
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={addTag}
              variant="secondary"
              className="ml-2"
              disabled={!tagInput.trim()}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {form.watch('tags')?.map((tag, index) => (
              <div 
                key={index}
                className="flex items-center bg-muted text-sm rounded-full px-3 py-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="is_public"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Make this prompt public</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Public prompts can be discovered by other users
                </p>
              </div>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || isPending}
          >
            {isSubmitting || isPending ? 'Saving...' : isEdit ? 'Update Prompt' : 'Create Prompt'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PromptForm;
