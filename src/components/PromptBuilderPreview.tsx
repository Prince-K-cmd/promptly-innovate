
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PromptBuilderFormData } from '@/hooks/use-prompt-builder';
import { Badge } from '@/components/ui/badge';
import { useCategories } from '@/hooks/use-categories';

interface PromptBuilderPreviewProps {
  formData: PromptBuilderFormData;
  generatedPrompt: string;
}

const PromptBuilderPreview: React.FC<PromptBuilderPreviewProps> = ({ 
  formData, 
  generatedPrompt 
}) => {
  const { categories } = useCategories();
  
  // Find the category name
  const categoryName = React.useMemo(() => {
    if (!formData.category) return 'Not selected';
    const category = categories.find(c => c.id === formData.category);
    return category ? category.name : formData.category.replace('_', ' ');
  }, [formData.category, categories]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Prompt Preview</span>
          {formData.category && (
            <Badge variant="outline" className="ml-2">
              {categoryName}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
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
          
          {Object.keys(formData.components || {}).length > 0 && (
            <div className="text-sm space-y-1">
              <span className="font-medium">Components:</span>
              <ul className="ml-5 list-disc space-y-1">
                {Object.entries(formData.components || {}).map(([key, value]) => (
                  value && (
                    <li key={key} className="text-xs">
                      <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {value}
                    </li>
                  )
                ))}
              </ul>
            </div>
          )}
          
          <div className="border-t pt-2 mt-2">
            <div className="font-medium text-sm mb-1">Generated Prompt:</div>
            <div className="p-3 bg-muted rounded-md text-sm">
              {generatedPrompt ? (
                <p className="whitespace-pre-wrap">{generatedPrompt}</p>
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
