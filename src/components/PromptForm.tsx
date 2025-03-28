
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Prompt } from '@/lib/supabase';

// Define the schema for form validation
const promptSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }).max(100),
  text: z.string().min(10, { message: 'Prompt must be at least 10 characters' }),
  category: z.string().min(1, { message: 'Please select a category' }),
  description: z.string().optional(),
  is_public: z.boolean().default(true),
  // Tags are handled separately
});

type PromptFormValues = z.infer<typeof promptSchema>;

// List of prompt categories
const CATEGORIES = [
  'General',
  'Creative Writing',
  'Academic',
  'Business',
  'Marketing',
  'Technical',
  'Personal',
  'Educational',
  'Entertainment',
  'Other',
];

// List of suggested tags
const SUGGESTED_TAGS = [
  'AI', 'Writing', 'Business', 'Marketing', 'Code', 'Learning',
  'Story', 'Email', 'Art', 'Development', 'Research', 'Productivity',
];

interface PromptFormProps {
  onSubmit: (values: any) => void;
  initialValues?: Partial<Prompt>;
  isEdit?: boolean;
  isPending?: boolean;
}

const PromptForm: React.FC<PromptFormProps> = ({
  onSubmit,
  initialValues,
  isEdit = false,
  isPending = false,
}) => {
  const [tags, setTags] = useState<string[]>(initialValues?.tags || []);
  const [tagInput, setTagInput] = useState('');

  // Initialize form with react-hook-form and zod validation
  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: initialValues?.title || '',
      text: initialValues?.text || '',
      category: initialValues?.category || '',
      description: initialValues?.description || '',
      is_public: initialValues?.is_public ?? true,
    },
  });

  // Function to add a tag
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput('');
  };

  // Function to remove a tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle tag input key press (Enter to add)
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput) {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  // Handle suggested tag click
  const handleSuggestedTagClick = (tag: string) => {
    if (!tags.includes(tag.toLowerCase())) {
      addTag(tag);
    }
  };

  // Handle form submission
  const handleSubmit = (values: PromptFormValues) => {
    // Combine form values with tags
    const formData = {
      ...values,
      tags,
    };
    onSubmit(formData);
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
              <FormDescription>
                A clear title will help you and others find this prompt later
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your prompt text here..."
                  className="min-h-[150px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The actual prompt text that will be used
              </FormDescription>
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
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Categorize your prompt to help with organization
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Tags</FormLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="py-1 px-2">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {tag} tag</span>
                </button>
              </Badge>
            ))}
          </div>
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => tagInput && addTag(tagInput)}
            placeholder="Add tags (press Enter after each tag)"
            className="mb-2"
          />
          <div>
            <p className="text-sm text-muted-foreground mb-2">Suggested tags:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAGS.filter(tag => !tags.includes(tag.toLowerCase())).map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary"
                  onClick={() => handleSuggestedTagClick(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <FormDescription>
            Add up to 10 tags to help categorize this prompt
          </FormDescription>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add some details about how to use this prompt effectively..."
                  className="resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide additional context or instructions for using this prompt
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_public"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Make this prompt public</FormLabel>
                <FormDescription>
                  Public prompts can be viewed by everyone. Private prompts are only visible to you.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="submit"
            disabled={isPending}
            className="min-w-[120px]"
          >
            {isPending ? 'Saving...' : isEdit ? 'Update Prompt' : 'Create Prompt'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PromptForm;
