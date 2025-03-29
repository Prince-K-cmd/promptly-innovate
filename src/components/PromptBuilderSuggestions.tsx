
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Plus, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AISuggestion } from '@/services/ai';

interface PromptBuilderSuggestionsProps {
  suggestions: AISuggestion[];
  onSuggestionClick: (suggestion: AISuggestion) => void;
  isLoading?: boolean;
  providerName?: string;
}

// Helper function to get display name for suggestion type
const getTypeName = (type: string): string => {
  switch (type) {
    case 'category':
      return 'Categories';
    case 'tone':
      return 'Tones';
    case 'audience':
      return 'Audiences';
    case 'snippet':
      return 'Snippets';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

const PromptBuilderSuggestions: React.FC<PromptBuilderSuggestionsProps> = ({
  suggestions,
  onSuggestionClick,
  isLoading = false,
  providerName,
}) => {
  // Group suggestions by type - defined before any conditional returns
  const groupedSuggestions = React.useMemo(() => {
    if (!suggestions || suggestions.length === 0) {
      return {};
    }

    const groups: Record<string, AISuggestion[]> = {};

    suggestions.forEach(suggestion => {
      if (!groups[suggestion.type]) {
        groups[suggestion.type] = [];
      }
      groups[suggestion.type].push(suggestion);
    });

    return groups;
  }, [suggestions]);

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              <Lightbulb className="h-4 w-4 mr-2" />
              AI Suggestions
            </div>
            {providerName && (
              <Badge variant="outline" className="text-xs">
                {providerName}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">
              Generating AI suggestions...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              <Lightbulb className="h-4 w-4 mr-2" />
              AI Suggestions
            </div>
            {providerName && (
              <Badge variant="outline" className="text-xs">
                {providerName}
              </Badge>
            )}
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

  // Render suggestions grouped by type
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Lightbulb className="h-4 w-4 mr-2" />
            AI Suggestions
          </div>
          {providerName && (
            <Badge variant="outline" className="text-xs">
              {providerName}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => (
            <div key={type} className="space-y-2">
              <div className="flex items-center">
                <Badge variant="outline" className="text-xs">
                  {getTypeName(type)}
                </Badge>
              </div>

              <div className="space-y-2">
                {typeSuggestions.slice(0, 5).map((suggestion) => (
                  <Button
                    key={`${suggestion.type}-${suggestion.value}`}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-muted"
                    onClick={() => onSuggestionClick(suggestion)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                    <span className="line-clamp-2 text-sm">{suggestion.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-2 text-xs text-center text-muted-foreground">
            {providerName
              ? `Suggestions powered by ${providerName}`
              : 'Suggestions are personalized based on your prompt history'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptBuilderSuggestions;
