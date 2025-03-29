import { OpenAIService } from './openai';
import { GroqService } from './groq';
import { GeminiService } from './gemini';
import { AIService, AIPromptRequest, AISuggestion, AIServiceConfig } from './types';

export type { AIService, AIPromptRequest, AISuggestion, AIServiceConfig };

// Factory function to create the appropriate AI service based on provider
export function createAIService(provider: string, config: AIServiceConfig): AIService | null {
  try {
    switch (provider.toLowerCase()) {
      case 'openai':
        return new OpenAIService(config);
      case 'groq':
        return new GroqService(config);
      case 'gemini':
        return new GeminiService(config);
      default:
        console.warn(`Unsupported AI provider: ${provider}`);
        return null;
    }
  } catch (error) {
    // Log detailed error information
    console.error(`Error creating AI service for provider ${provider}:`, error);

    // Check for specific error types and provide more helpful messages
    if (error instanceof Error) {
      if (error.message.includes('browser')) {
        console.warn(`The ${provider} SDK is not configured to run in browser environments. Check the SDK configuration.`);
      } else if (error.message.includes('apiKey')) {
        console.warn(`Invalid API key format for ${provider}. Please check your API key.`);
      }
    }

    return null;
  }
}

// Fallback suggestions when no AI service is available
export function getFallbackSuggestions(step: number): AISuggestion[] {
  switch (step) {
    case 0: // Category selection
      return [
        { type: 'category', value: 'creative_writing', text: 'Creative Writing' },
        { type: 'category', value: 'business', text: 'Business Communication' },
        { type: 'category', value: 'academic', text: 'Academic Research' },
        { type: 'category', value: 'coding', text: 'Programming & Development' },
        { type: 'category', value: 'marketing', text: 'Marketing & Advertising' }
      ];
    case 1: // Tone selection
      return [
        { type: 'tone', value: 'professional', text: 'Professional' },
        { type: 'tone', value: 'friendly', text: 'Friendly & Conversational' },
        { type: 'tone', value: 'authoritative', text: 'Authoritative' },
        { type: 'tone', value: 'creative', text: 'Creative & Imaginative' },
        { type: 'tone', value: 'technical', text: 'Technical & Precise' }
      ];
    case 2: // Audience selection
      return [
        { type: 'audience', value: 'general', text: 'General Audience' },
        { type: 'audience', value: 'experts', text: 'Domain Experts' },
        { type: 'audience', value: 'beginners', text: 'Beginners & Newcomers' },
        { type: 'audience', value: 'business', text: 'Business Professionals' },
        { type: 'audience', value: 'students', text: 'Students & Academics' }
      ];
    case 3: // Components/snippets
      return [
        { type: 'snippet', value: 'context', text: 'Add detailed context about the topic' },
        { type: 'snippet', value: 'examples', text: 'Include specific examples' },
        { type: 'snippet', value: 'constraints', text: 'Specify constraints or limitations' },
        { type: 'snippet', value: 'format', text: 'Define the desired output format' },
        { type: 'snippet', value: 'steps', text: 'Break down into step-by-step instructions' }
      ];
    default:
      return [];
  }
}
