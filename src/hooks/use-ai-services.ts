import { useState, useCallback, useEffect } from 'react';
import { useApiKeys } from '@/hooks/use-api-keys';
import { useToast } from '@/hooks/use-toast';
import { createAIService, getFallbackSuggestions, AIPromptRequest, AISuggestion } from '@/services/ai';

// Simple cache for AI responses to prevent duplicate API calls
interface CacheEntry {
  timestamp: number;
  data: any;
}

const suggestionCache = new Map<string, CacheEntry>();
const promptCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60000; // Cache entries expire after 1 minute

// Create a cache key from a request
function createCacheKey(request: AIPromptRequest): string {
  return JSON.stringify({
    category: request.category || '',
    tone: request.tone || '',
    audience: request.audience || '',
    goal: request.goal || '',
    step: request.step || 0
  });
}

export function useAIServices() {
  const { apiKeys, getApiKeyByProvider } = useApiKeys();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Clear expired cache entries
  useEffect(() => {
    const now = Date.now();

    // Clear expired suggestion cache entries
    suggestionCache.forEach((entry, key) => {
      if (now - entry.timestamp > CACHE_TTL) {
        suggestionCache.delete(key);
      }
    });

    // Clear expired prompt cache entries
    promptCache.forEach((entry, key) => {
      if (now - entry.timestamp > CACHE_TTL) {
        promptCache.delete(key);
      }
    });
  }, []);

  // Get available AI providers
  const getAvailableProviders = useCallback(() => {
    return apiKeys
      .filter(key => ['openai', 'groq', 'gemini'].includes(key.provider))
      .map(key => key.provider);
  }, [apiKeys]);

  // Helper function to try generating suggestions with a specific provider
  const tryProviderForSuggestions = useCallback(async (
    provider: string,
    request: AIPromptRequest,
    cacheKey: string
  ): Promise<AISuggestion[] | null> => {
    try {
      const apiKey = getApiKeyByProvider(provider);

      if (!apiKey) {
        console.warn(`No API key found for ${provider}`);
        return null;
      }

      const service = createAIService(provider, { apiKey: apiKey.key });

      if (!service) {
        console.warn(`Failed to initialize ${provider} service`);
        return null;
      }

      console.log(`Attempting to generate suggestions with ${provider}...`);
      const suggestions = await service.generateSuggestions(request);
      console.log(`Successfully generated suggestions with ${provider}`);

      // Cache the result
      suggestionCache.set(cacheKey, {
        timestamp: Date.now(),
        data: suggestions
      });

      return suggestions;
    } catch (error) {
      console.error(`Error with ${provider} service:`, error);
      if (error instanceof Error) {
        // Show toast only for specific errors that might need user attention
        if (error.message.includes('API key') || error.message.includes('authentication')) {
          toast({
            variant: "warning",
            title: `${provider} API Key Issue`,
            description: `There may be an issue with your ${provider} API key. Please check your settings.`,
          });
        } else if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
          toast({
            variant: "warning",
            title: `Rate Limit Exceeded`,
            description: `${provider} API rate limit exceeded. Please wait a moment before trying again.`,
          });
          // Signal rate limit error
          throw new Error('RATE_LIMIT');
        }
      }
      return null;
    }
  }, [getApiKeyByProvider, toast]);

  // Generate suggestions using the first available AI provider
  const generateSuggestions = useCallback(async (request: AIPromptRequest): Promise<AISuggestion[]> => {
    // Return fallback suggestions immediately if no step is provided
    if (request.step === undefined) {
      return getFallbackSuggestions(0);
    }

    // Check if we have providers before setting loading state
    const availableProviders = getAvailableProviders();
    if (availableProviders.length === 0) {
      return getFallbackSuggestions(request.step);
    }

    // Check cache first
    const cacheKey = createCacheKey(request);
    const cachedEntry = suggestionCache.get(cacheKey);

    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL)) {
      console.log('Using cached suggestions');
      return cachedEntry.data;
    }

    setIsGenerating(true);

    try {
      // Try each provider in order until one succeeds
      for (const provider of availableProviders) {
        try {
          const result = await tryProviderForSuggestions(provider, request, cacheKey);
          if (result) {
            return result;
          }
          // If null is returned, continue to the next provider
        } catch (error) {
          // If it's a rate limit error, return fallback suggestions immediately
          if (error instanceof Error && error.message === 'RATE_LIMIT') {
            return getFallbackSuggestions(request.step);
          }
          // For other errors, continue to the next provider
        }
      }

      // If all providers failed, return fallback suggestions
      return getFallbackSuggestions(request.step);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        variant: "destructive",
        title: "Failed to generate suggestions",
        description: "An error occurred while generating AI suggestions.",
      });
      return getFallbackSuggestions(request.step);
    } finally {
      setIsGenerating(false);
    }
  }, [getAvailableProviders, tryProviderForSuggestions]);

  // Helper function to try generating a prompt with a specific provider
  const tryProviderForPrompt = useCallback(async (
    provider: string,
    request: AIPromptRequest,
    cacheKey: string
  ): Promise<string | null> => {
    try {
      const apiKey = getApiKeyByProvider(provider);

      if (!apiKey) {
        console.warn(`No API key found for ${provider}`);
        return null;
      }

      const service = createAIService(provider, { apiKey: apiKey.key });

      if (!service?.generatePrompt) {
        console.warn(`Failed to initialize ${provider} service or service doesn't support prompt generation`);
        return null;
      }

      console.log(`Attempting to generate prompt with ${provider}...`);
      const prompt = await service.generatePrompt(request);
      console.log(`Successfully generated prompt with ${provider}`);

      // Cache the result
      promptCache.set(cacheKey, {
        timestamp: Date.now(),
        data: prompt
      });

      return prompt;
    } catch (error) {
      console.error(`Error with ${provider} service:`, error);
      if (error instanceof Error) {
        // Show toast only for specific errors that might need user attention
        if (error.message.includes('API key') || error.message.includes('authentication')) {
          toast({
            variant: "warning",
            title: `${provider} API Key Issue`,
            description: `There may be an issue with your ${provider} API key. Please check your settings.`,
          });
        } else if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
          toast({
            variant: "warning",
            title: `Rate Limit Exceeded`,
            description: `${provider} API rate limit exceeded. Please wait a moment before trying again.`,
          });
          // Signal rate limit error
          throw new Error('RATE_LIMIT');
        }
      }
      return null;
    }
  }, [getApiKeyByProvider, toast]);

  // Generate a prompt using the first available AI provider
  const generatePrompt = useCallback(async (request: AIPromptRequest): Promise<string> => {
    // Check if we have providers before setting loading state
    const availableProviders = getAvailableProviders();
    if (availableProviders.length === 0) {
      toast({
        variant: "warning",
        title: "No AI providers available",
        description: "Add an API key in settings to enable AI-generated prompts.",
      });
      return '';
    }

    // Check cache first
    const cacheKey = createCacheKey(request);
    const cachedEntry = promptCache.get(cacheKey);

    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL)) {
      console.log('Using cached prompt');
      return cachedEntry.data;
    }

    setIsGenerating(true);

    try {
      // Try each provider in order until one succeeds
      for (const provider of availableProviders) {
        try {
          const result = await tryProviderForPrompt(provider, request, cacheKey);
          if (result) {
            return result;
          }
          // If null is returned, continue to the next provider
        } catch (error) {
          // If it's a rate limit error, return empty string immediately
          if (error instanceof Error && error.message === 'RATE_LIMIT') {
            return '';
          }
          // For other errors, continue to the next provider
        }
      }

      // If all providers failed, show error
      toast({
        variant: "destructive",
        title: "Failed to generate prompt",
        description: "All available AI providers failed to generate a prompt.",
      });
      return '';
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast({
        variant: "destructive",
        title: "Failed to generate prompt",
        description: "An error occurred while generating the AI prompt.",
      });
      return '';
    } finally {
      setIsGenerating(false);
    }
  }, [getAvailableProviders, tryProviderForPrompt, toast]);

  // Generate with specific provider
  const generateWithProvider = useCallback(async (
    provider: string,
    request: AIPromptRequest,
    type: 'suggestions' | 'prompt' | 'test' = 'suggestions'
  ): Promise<AISuggestion[] | string> => {
    setIsGenerating(true);

    try {
      const apiKey = getApiKeyByProvider(provider);

      if (!apiKey) {
        toast({
          variant: "warning",
          title: `No ${provider} API key found`,
          description: `Add a ${provider} API key in settings to use this provider.`,
        });
        return type === 'suggestions' ? [] : '';
      }

      const service = createAIService(provider, { apiKey: apiKey.key });

      if (!service) {
        toast({
          variant: "warning",
          title: `Unsupported provider: ${provider}`,
          description: "This AI provider is not supported.",
        });
        return type === 'suggestions' ? [] : '';
      }

      if ((type === 'prompt' || type === 'test') && !service.generatePrompt) {
        toast({
          variant: "warning",
          title: `Prompt generation not supported`,
          description: `${provider} does not support prompt generation.`,
        });
        return '';
      }

      if (type === 'suggestions') {
        return await service.generateSuggestions(request);
      } else if (type === 'test' && request.prompt) {
        // For test mode, we'll use the generatePrompt method but with a special request
        // that includes the combined prompt and sample input
        console.log('Testing prompt with AI:', request.prompt);

        // Create a custom request for testing
        const testRequest: AIPromptRequest = {
          customPrompt: request.prompt, // Use the combined prompt directly
          category: request.category,
          tone: request.tone,
          audience: request.audience,
          step: request.step
        };

        return await service.generatePrompt(testRequest);
      } else {
        return await service.generatePrompt(request);
      }
    } catch (error) {
      console.error(`Error with ${provider} service:`, error);
      toast({
        variant: "destructive",
        title: `Failed to use ${provider}`,
        description: "An error occurred while using this AI provider.",
      });
      return type === 'suggestions' ? [] : '';
    } finally {
      setIsGenerating(false);
    }
  }, [getApiKeyByProvider, toast]);

  return {
    isGenerating,
    getAvailableProviders,
    generateSuggestions,
    generatePrompt,
    generateWithProvider
  };
}
