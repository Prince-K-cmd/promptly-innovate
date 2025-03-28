
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PromptBuilderFormData } from '@/hooks/use-prompt-builder';

interface PromptBuilderPreviewProps {
  formData: PromptBuilderFormData;
  generatedPrompt: string;
}

const PromptBuilderPreview: React.FC<PromptBuilderPreviewProps> = ({ 
  formData, 
  generatedPrompt 
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Prompt Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Category:</span>{' '}
            {formData.category ? formData.category.replace('_', ' ') : 'Not selected'}
          </div>
          
          {formData.tone && (
            <div className="text-sm">
              <span className="font-medium">Tone:</span> {formData.tone}
            </div>
          )}
          
          {formData.audience && (
            <div className="text-sm">
              <span className="font-medium">Audience:</span> {formData.audience}
            </div>
          )}
          
          <div className="border-t pt-2 mt-2">
            <div className="font-medium text-sm mb-1">Generated Prompt:</div>
            <div className="p-3 bg-muted rounded-md text-sm">
              {generatedPrompt ? (
                generatedPrompt
              ) : (
                <span className="text-muted-foreground italic">
                  Complete the steps to generate your prompt
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptBuilderPreview;
