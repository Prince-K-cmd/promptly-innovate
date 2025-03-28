
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PromptForm from '@/components/PromptForm';
import { usePrompts } from '@/hooks/use-prompts';
import { Card, CardContent } from '@/components/ui/card';

const CreatePromptPage = () => {
  const navigate = useNavigate();
  const { createPrompt } = usePrompts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePrompt = async (values: any) => {
    setIsSubmitting(true);
    try {
      await createPrompt(values);
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
