
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Suggestion {
  type: string;
  value: string;
  text: string;
  snippet?: any;
}

interface PromptBuilderSuggestionsProps {
  suggestions: Suggestion[];
  onSuggestionClick: (suggestion: Suggestion) => void;
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

  // Group suggestions by type
  const groupedSuggestions = React.useMemo(() => {
    const groups: Record<string, Suggestion[]> = {};
    
    suggestions.forEach(suggestion => {
      if (!groups[suggestion.type]) {
        groups[suggestion.type] = [];
      }
      groups[suggestion.type].push(suggestion);
    });
    
    return groups;
  }, [suggestions]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Lightbulb className="h-4 w-4 mr-2" />
          AI Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => (
            <div key={type} className="space-y-2">
              <div className="flex items-center">
                <Badge variant="outline" className="text-xs">
                  {type === 'category' ? 'Categories' : 
                   type === 'tone' ? 'Tones' : 
                   type === 'snippet' ? 'Snippets' : type}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {typeSuggestions.slice(0, 3).map((suggestion, index) => (
                  <Button
                    key={index}
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
            Suggestions are personalized based on your prompt history
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptBuilderSuggestions;
