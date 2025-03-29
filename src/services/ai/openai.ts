import { AIService, AIPromptRequest, AISuggestion, AIServiceConfig } from './types';
import OpenAI from 'openai';

export class OpenAIService implements AIService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(config: AIServiceConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true // Allow running in browser environment
    });
    this.model = config.model || 'gpt-3.5-turbo';
  }

  async generateSuggestions(request: AIPromptRequest): Promise<AISuggestion[]> {
    try {
      // Set a timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('OpenAI request timed out')), 10000);
      });

      const responsePromise = this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides suggestions for prompt building. Respond in JSON format only.'
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
        throw new Error('No content returned from OpenAI');
      }

      try {
        const parsedContent = JSON.parse(content);
        if (!parsedContent.suggestions || !Array.isArray(parsedContent.suggestions)) {
          throw new Error('Invalid response format from OpenAI');
        }
        return this.formatSuggestions(parsedContent.suggestions);
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        throw new Error('Failed to parse OpenAI response');
      }
    } catch (error) {
      console.error('OpenAI suggestion generation error:', error);
      throw error;
    }
  }

  async generatePrompt(request: AIPromptRequest): Promise<string> {
    try {
      // Set a timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('OpenAI request timed out')), 10000);
      });

      const responsePromise = this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates high-quality prompts based on user requirements.'
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
      console.error('OpenAI prompt generation error:', error);
      throw error;
    }
  }

  private createPromptForSuggestions(request: AIPromptRequest): string {
    const { category, tone, audience, step } = request;

    let prompt = 'Generate suggestions for a prompt builder in JSON format. ';

    if (step === 0) {
      prompt += 'The user is selecting a category. Suggest 5 categories for prompts.';
    } else if (step === 1) {
      prompt += `The user selected "${category}" as the category. Suggest 5 tones that would work well for this category.`;
    } else if (step === 2) {
      prompt += `The user is building a ${category} prompt with a ${tone || 'neutral'} tone. Suggest 5 potential audiences for this prompt.`;
    } else if (step === 3) {
      prompt += `The user is building a ${category} prompt with a ${tone || 'neutral'} tone for ${audience || 'general'} audience. Suggest 5 snippets or components that could enhance this prompt.`;
    }

    prompt += ' Return a JSON object with an array called "suggestions" where each item has "type" (category, tone, audience, or snippet), "value" (the actual suggestion), and "text" (a user-friendly description of the suggestion).';

    return prompt;
  }

  private createPromptForGeneration(request: AIPromptRequest): string {
    const { category, tone, audience, goal, components } = request;

    let prompt = 'Generate a high-quality prompt based on the following requirements:\n\n';

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

    prompt += '\nCreate a well-structured, detailed prompt that incorporates all these elements. The prompt should be ready to use with AI systems.';

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
