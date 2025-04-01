import { AIService, AIPromptRequest, AISuggestion, AIServiceConfig } from './types';
import Groq from 'groq-sdk';
import {
  createSystemPrompt,
  createSuggestionsSystemPrompt,
  shouldUseShotPrompting,
  getShotPromptingExamples,
  createTailoredSuggestionsPrompt
} from '@/lib/utils/prompt-templates';

// Track last request time to implement rate limiting
let lastGroqRequestTime = 0;
const GROQ_RATE_LIMIT_MS = 2000; // Minimum 2 seconds between requests

export class GroqService implements AIService {
  private readonly client: Groq;
  private readonly model: string;

  constructor(config: AIServiceConfig) {
    this.client = new Groq({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true // Allow running in browser environment
    });
    this.model = config.model || 'llama-3.1-8b-instant';
  }

  // Helper method to enforce rate limiting
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastGroqRequestTime;

    if (timeSinceLastRequest < GROQ_RATE_LIMIT_MS) {
      const waitTime = GROQ_RATE_LIMIT_MS - timeSinceLastRequest;
      console.log(`Rate limiting Groq API - waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastGroqRequestTime = Date.now();
  }

  async generateSuggestions(request: AIPromptRequest): Promise<AISuggestion[]> {
    try {
      // Apply rate limiting before making the request
      await this.enforceRateLimit();

      // Set a timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Groq request timed out')), 10000);
      });

      const responsePromise = this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: createSuggestionsSystemPrompt()
          },
          {
            role: 'user',
            content: this.createPromptForSuggestions(request)
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      // Race between the API call and the timeout
      const response = await Promise.race([responsePromise, timeoutPromise]);

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content returned from Groq');
      }

      try {
        const parsedContent = JSON.parse(content);
        if (!parsedContent.suggestions || !Array.isArray(parsedContent.suggestions)) {
          throw new Error('Invalid response format from Groq');
        }
        return this.formatSuggestions(parsedContent.suggestions);
      } catch (parseError) {
        console.error('Error parsing Groq response:', parseError);
        throw new Error('Failed to parse Groq response');
      }
    } catch (error) {
      console.error('Groq suggestion generation error:', error);
      throw error;
    }
  }

  async generatePrompt(request: AIPromptRequest): Promise<string> {
    try {
      // Apply rate limiting before making the request
      await this.enforceRateLimit();

      // Set a timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Groq request timed out')), 10000);
      });

      const responsePromise = this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: createSystemPrompt()
          },
          {
            role: 'user',
            content: this.createPromptForGeneration(request)
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      // Race between the API call and the timeout
      const response = await Promise.race([responsePromise, timeoutPromise]);

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Groq prompt generation error:', error);
      throw error;
    }
  }

  private createPromptForSuggestions(request: AIPromptRequest): string {
    const { category, tone, audience, step, components } = request;

    // For the final step, use the tailored suggestions prompt
    if (step === 3) {
      return createTailoredSuggestionsPrompt(category, tone, audience, components);
    }

    let prompt = 'Generate suggestions for a prompt builder in JSON format. You MUST return EXACTLY 5 suggestions, no more and no less. ';

    if (step === 0) {
      prompt += 'The user is selecting a category. Suggest 5 diverse categories for prompts. Include both creative and technical categories.';
    } else if (step === 1) {
      prompt += `The user selected "${category}" as the category. Suggest 5 different tones that would work well for this category. Consider the range from formal to casual, and technical to conversational.`;
    } else if (step === 2) {
      prompt += `The user is building a ${category} prompt with a ${tone || 'neutral'} tone. Suggest 5 distinct potential audiences for this prompt. Consider different expertise levels and contexts.`;
    }

    prompt += ' Return a JSON object with an array called "suggestions" containing EXACTLY 5 items. Each item must have "type" (category, tone, audience, or snippet), "value" (the actual suggestion), and "text" (a user-friendly description of the suggestion).';
    prompt += ' Format your response as a valid JSON object. Do not include any explanations or markdown formatting outside the JSON.';

    return prompt;
  }

  private createPromptForGeneration(request: AIPromptRequest): string {
    // If customPrompt is provided, use it directly (for testing)
    if (request.customPrompt) {
      return request.customPrompt;
    }

    const { category, tone, audience, goal, components } = request;

    let prompt = 'Generate a concise but informative prompt based on these requirements. The prompt should be direct and contain enough context without being overly verbose. Your response should ONLY include the prompt text itself with no additional explanations, introductions, or formatting:\n\n';

    if (category) prompt += `Category: ${category}\n`;
    if (tone) prompt += `Tone: ${tone}\n`;
    if (audience) prompt += `Target Audience: ${audience}\n`;
    if (goal) prompt += `Goal: ${goal}\n`;

    if (components && Object.keys(components).length > 0) {
      prompt += '\nComponents:\n';
      Object.entries(components).forEach(([key, value]) => {
        prompt += `- ${key}: ${value}\n`;
      });
    }

    // Add shot prompting examples if appropriate for this category/context
    if (shouldUseShotPrompting(category, components)) {
      const examples = getShotPromptingExamples(category);
      if (examples) {
        prompt += `\n${examples}\n`;
        prompt += '\nCreate a prompt following a similar structure but tailored to the requirements above.\n';
      }
    }

    prompt += '\nGuidelines:\n';
    prompt += '1. Be concise and direct - avoid unnecessary words\n';
    prompt += '2. Make the prompt general without assuming specific use cases\n';
    prompt += '3. Include only essential context and requirements\n';
    prompt += '4. Use clear, straightforward language\n';
    prompt += '\nIMPORTANT: Do NOT include phrases like "Here is a prompt" or "Based on your requirements". Start directly with the prompt content. Do NOT add any explanatory text before or after the prompt.';

    return prompt;
  }

  private formatSuggestions(suggestions: any[]): AISuggestion[] {
    if (!Array.isArray(suggestions)) {
      return [];
    }

    return suggestions.map(suggestion => ({
      type: suggestion.type || 'snippet',
      value: suggestion.value || suggestion.text,
      text: suggestion.text || suggestion.value,
      snippet: suggestion.snippet || null
    }));
  }
}
