
import { useState, useCallback } from 'react';
import { useApiKeys } from './use-api-keys';
import { useToast } from './use-toast';
import { AIService, AIProvider, AISuggestion } from '@/services/ai/types';

interface AIServiceOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  preferredService?: AIService;
}

interface PromptOptions {
  step?: number;
  category?: string;
  tone?: string;
  audience?: string;
  goal?: string;
  components?: Record<string, string>;
}

export function useAIServices() {
  const { apiKeys } = useApiKeys();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const hasApiKey = useCallback((service: AIService) => {
    return apiKeys.some(key => key.service === service && key.api_key.trim() !== '');
  }, [apiKeys]);
  
  const getAvailableServices = useCallback(() => {
    return Object.values(AIService).filter(service => hasApiKey(service));
  }, [hasApiKey]);
  
  // For our mock purposes, create a function to check if we have a specific provider
  const getAvailableProviders = useCallback(() => {
    const providers = [];
    
    if (hasApiKey(AIService.OpenAI)) {
      providers.push('openai');
    }
    
    if (hasApiKey(AIService.Gemini)) {
      providers.push('gemini');
    }
    
    if (hasApiKey(AIService.Groq)) {
      providers.push('groq');
    }
    
    return providers;
  }, [hasApiKey]);
  
  const generateChatCompletion = async (messages, options: AIServiceOptions = {}) => {
    setLoading(true);
    setError('');
    
    try {
      const availableServices = getAvailableServices();
      
      if (availableServices.length === 0) {
        throw new Error('No API keys configured. Please add an API key in settings.');
      }
      
      // Use preferred service if available, otherwise use the first available
      const serviceToUse = options.preferredService && hasApiKey(options.preferredService)
        ? options.preferredService
        : availableServices[0];
        
      // Implementation would typically use the actual AI service here
      // But for our purposes, we'll just mock a response
      const response = {
        text: "This is a simulated AI response. In production, this would use an actual AI provider.",
        model: options.model || "default-model",
        service: serviceToUse
      };
      
      return response;
    } catch (err) {
      setError(err.message || 'Error generating AI response');
      toast({
        variant: "destructive",
        title: "AI Generation Error",
        description: err.message || 'An error occurred during AI generation'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Mock implementation for improvePrompt
  const improvePrompt = async (promptText: string, options: AIServiceOptions = {}) => {
    setLoading(true);
    setError('');
    
    try {
      if (!promptText) {
        throw new Error('Prompt text is required');
      }
      
      // Mock improved prompt
      const improvedPrompt = `Improved: ${promptText}\n\nWith additional details and clarity for better results.`;
      
      return improvedPrompt;
    } catch (err) {
      setError(err.message || 'Error improving prompt');
      toast({
        variant: "destructive",
        title: "Error Improving Prompt",
        description: err.message
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Mock implementation for generateSuggestions
  const generateSuggestions = async (options: PromptOptions = {}): Promise<AISuggestion[]> => {
    setLoading(true);
    
    try {
      // Generate mock suggestions based on the step and other options
      const suggestions: AISuggestion[] = [];
      
      const step = options.step || 0;
      
      if (step === 0 || step === 1) {
        suggestions.push(
          {
            type: 'category',
            value: 'creative_writing',
            text: 'Creative Writing'
          },
          {
            type: 'category',
            value: 'business',
            text: 'Business'
          },
          {
            type: 'tone',
            value: 'professional',
            text: 'Professional tone'
          }
        );
      }
      
      if (step === 2) {
        if (options.category === 'creative_writing') {
          suggestions.push(
            {
              type: 'snippet',
              value: 'A mysterious island with ancient ruins',
              text: 'A mysterious island with ancient ruins'
            },
            {
              type: 'snippet',
              value: 'A detective with a troubled past',
              text: 'A detective with a troubled past'
            }
          );
        } else if (options.category === 'business') {
          suggestions.push(
            {
              type: 'snippet',
              value: 'Quarterly financial report',
              text: 'Quarterly financial report'
            },
            {
              type: 'snippet',
              value: 'Marketing strategy proposal',
              text: 'Marketing strategy proposal'
            }
          );
        } else {
          suggestions.push(
            {
              type: 'snippet',
              value: 'Advanced techniques for problem-solving',
              text: 'Advanced techniques for problem-solving'
            }
          );
        }
      }
      
      if (step === 3) {
        suggestions.push(
          {
            type: 'snippet',
            value: 'Include specific examples and case studies',
            text: 'Include specific examples and case studies'
          },
          {
            type: 'snippet',
            value: 'Format with clear headings and bullet points',
            text: 'Format with clear headings and bullet points'
          }
        );
      }
      
      // Add small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return suggestions;
    } catch (err) {
      console.error('Error generating suggestions:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Mock implementation for generatePrompt
  const generatePrompt = async (options: PromptOptions = {}): Promise<string> => {
    setLoading(true);
    
    try {
      const { category, tone, audience, goal, components } = options;
      
      // Generate a formatted prompt based on the options
      let generatedPrompt = '';
      
      if (category === 'creative_writing') {
        generatedPrompt = `Write a ${tone || 'engaging'} story`;
        if (components?.theme) {
          generatedPrompt += ` about ${components.theme}`;
        }
        if (components?.character) {
          generatedPrompt += ` featuring ${components.character}`;
        }
        if (components?.setting) {
          generatedPrompt += ` set in ${components.setting}`;
        }
      } else if (category === 'business') {
        generatedPrompt = `Create a ${components?.documentType || 'professional document'}`;
        if (components?.topic) {
          generatedPrompt += ` about ${components.topic}`;
        }
        if (audience) {
          generatedPrompt += ` for ${audience}`;
        }
        if (components?.sections) {
          generatedPrompt += ` including sections on ${components.sections}`;
        }
      } else if (category === 'coding') {
        generatedPrompt = `Write ${components?.language || 'code'}`;
        if (components?.functionality) {
          generatedPrompt += ` that ${components.functionality}`;
        }
        if (components?.implementation) {
          generatedPrompt += `. Implementation details: ${components.implementation}`;
        }
      } else {
        generatedPrompt = `Create ${category || 'content'}`;
        if (tone) {
          generatedPrompt += ` with a ${tone} tone`;
        }
        if (audience) {
          generatedPrompt += ` for ${audience}`;
        }
        if (goal) {
          generatedPrompt += `. ${goal}`;
        }
      }
      
      // Add output format if specified
      if (components?.outputFormat) {
        generatedPrompt += `\n\nPlease format your response as a ${components.outputFormat}.`;
      }
      
      // Add length requirement if specified
      if (components?.outputLength) {
        generatedPrompt += `\n\nThe response should be approximately ${components.outputLength} in length.`;
      }
      
      // Add additional instructions if specified
      if (components?.additionalInstructions) {
        generatedPrompt += `\n\nAdditional instructions: ${components.additionalInstructions}`;
      }
      
      // Add small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return generatedPrompt + '.';
    } catch (err) {
      console.error('Error generating prompt:', err);
      toast({
        variant: "destructive",
        title: "Error Generating Prompt",
        description: err.message || 'An error occurred while generating the prompt'
      });
      return '';
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    hasApiKey,
    getAvailableServices,
    generateChatCompletion,
    improvePrompt,
    // Additional functions needed by our components
    isGenerating: loading,
    generateSuggestions,
    generatePrompt,
    getAvailableProviders
  };
}
