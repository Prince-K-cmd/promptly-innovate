
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';

interface PromptBuilderSuggestionsProps {
  suggestions: any[];
  onSuggestionClick: (suggestion: any) => void;
}

const PromptBuilderSuggestions: React.FC<PromptBuilderSuggestionsProps> = ({
  suggestions,
  onSuggestionClick,
}) => {
  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Lightbulb className="h-4 w-4 mr-2" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Continue building your prompt to see personalized suggestions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Lightbulb className="h-4 w-4 mr-2" />
          AI Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.slice(0, 5).map((suggestion, index) => (
            <div key={index} className="text-sm">
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-2 px-3"
                onClick={() => onSuggestionClick(suggestion)}
              >
                <span className="line-clamp-2">{suggestion.text}</span>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptBuilderSuggestions;
