import { z } from 'zod';

export const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  text: z.string().min(10, 'Prompt text must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().optional(),
  is_public: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

export type PromptFormValues = z.infer<typeof formSchema>;
