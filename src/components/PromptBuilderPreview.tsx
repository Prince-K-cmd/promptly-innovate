
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromptBuilderFormData } from '@/hooks/use-prompt-builder';

interface PromptBuilderPreviewProps {
  formData: PromptBuilderFormData;
  generatedPrompt: string;
}

const PromptBuilderPreview: React.FC<PromptBuilderPreviewProps> = ({
  formData,
  generatedPrompt
}) => {
  // Generate a simple preview prompt based on the form data
  const generatePreviewPrompt = () => {
    if (!formData.category) {
      return "Your prompt preview will appear here once you've added some details.";
    }

    let prompt = '';

    switch (formData.category) {
      case 'creative_writing':
        prompt = `Write a ${formData.tone || 'creative'} story`;
        if (formData.components.theme) {
          prompt += ` about ${formData.components.theme}`;
        }
        if (formData.components.character) {
          prompt += ` featuring ${formData.components.character}`;
        }
        if (formData.components.setting) {
          prompt += ` set in ${formData.components.setting}`;
        }
        break;

      case 'business':
        prompt = `Create a ${formData.components.documentType || 'business document'}`;
        if (formData.components.topic) {
          prompt += ` about ${formData.components.topic}`;
        }
        if (formData.audience) {
          prompt += ` for ${formData.audience}`;
        }
        if (formData.components.sections) {
          prompt += ` including sections on ${formData.components.sections}`;
        }
        break;

      case 'coding':
        prompt = `Write ${formData.components.language || 'code'}`;
        if (formData.components.functionality) {
          prompt += ` that ${formData.components.functionality}`;
        }
        if (formData.components.implementation) {
          prompt += `. Implementation details: ${formData.components.implementation}`;
        }
        break;

      default:
        prompt = `Create ${formData.category || 'content'}`;
        if (formData.tone) {
          prompt += ` with a ${formData.tone} tone`;
        }
        if (formData.audience) {
          prompt += ` for ${formData.audience}`;
        }
        if (formData.goal) {
          prompt += `. ${formData.goal}`;
        }
    }

    return prompt + '.';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Prompt Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preview">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="final" disabled={!generatedPrompt}>Final</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="pt-4">
            <div className="bg-muted p-4 rounded-md min-h-[150px]">
              <p className="whitespace-pre-wrap">{generatePreviewPrompt()}</p>
            </div>
          </TabsContent>
          <TabsContent value="final" className="pt-4">
            <div className="bg-muted p-4 rounded-md min-h-[150px]">
              <p className="whitespace-pre-wrap">{generatedPrompt || "No generated prompt yet."}</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PromptBuilderPreview;
