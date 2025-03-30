
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';

interface Suggestion {
  type: string;
  value: string;
  text: string;
}

interface PromptBuilderSuggestionsProps {
  suggestions: Suggestion[];
  onSuggestionClick: (suggestion: Suggestion) => void;
  isLoading: boolean;
  providerName: string | null;
}

const PromptBuilderSuggestions: React.FC<PromptBuilderSuggestionsProps> = ({
  suggestions,
  onSuggestionClick,
  isLoading,
  providerName
}) => {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'category':
        return 'Category';
      case 'tone':
        return 'Tone';
      case 'audience':
        return 'Audience';
      case 'snippet':
        return 'Suggestion';
      default:
        return 'Suggestion';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-primary" />
            <span>Suggestions</span>
          </div>
          
          {providerName && (
            <div className="text-xs font-normal text-muted-foreground">
              via {providerName}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-4">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Generating suggestions...</p>
          </div>
        ) : suggestions && suggestions.length > 0 ? (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="group">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => onSuggestionClick(suggestion)}
                >
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {getTypeLabel(suggestion.type)}
                    </div>
                    <div className="text-sm">{suggestion.text}</div>
                  </div>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4">
            <p className="text-sm text-muted-foreground">No suggestions available yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add more details to get personalized suggestions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromptBuilderSuggestions;
