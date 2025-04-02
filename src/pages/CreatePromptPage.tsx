
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PromptForm from '@/components/PromptForm';
import { usePrompts } from '@/hooks/use-prompts';
import { Card, CardContent } from '@/components/ui/card';
import { type PromptFormValues } from '@/lib/schemas/promptSchema';

const CreatePromptPage = () => {
  const navigate = useNavigate();
  const { createPrompt } = usePrompts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePrompt = async (values: PromptFormValues) => {
    setIsSubmitting(true);
    try {
      // Ensure all required fields are present
      const promptData = {
        title: values.title,
        text: values.text,
        category: values.category,
        description: values.description || '',
        is_public: values.is_public || false,
        tags: values.tags || [],
      };
      
      await createPrompt(promptData);
      navigate('/library');
    } catch (error) {
      console.error('Failed to create prompt:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 animate-slide-down">Create New Prompt</h1>

      <Card className="animate-slide-up border-0 shadow-md">
        <CardContent className="pt-6">
          <PromptForm onSubmit={handleCreatePrompt} isPending={isSubmitting} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePromptPage;
