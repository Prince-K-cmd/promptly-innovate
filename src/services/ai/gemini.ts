import { AIService, AIPromptRequest, AISuggestion, AIServiceConfig } from './types';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export class GeminiService implements AIService {
  private readonly client: GoogleGenerativeAI;
  private readonly model: GenerativeModel;
  private readonly modelName: string;

  constructor(config: AIServiceConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.modelName = config.model || 'gemini-1.5-pro';
    this.model = this.client.getGenerativeModel({ model: this.modelName });
  }

  async generateSuggestions(request: AIPromptRequest): Promise<AISuggestion[]> {
    try {
      const prompt = this.createPromptForSuggestions(request);

      // Set a timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini request timed out')), 10000);
      });

      const generatePromise = async () => {
        try {
          const result = await this.model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500
            }
          });
          return result;
        } catch (error) {
          console.error('Gemini API error:', error);
          throw error;
        }
      };

      // Race between the API call and the timeout
      const result = await Promise.race([generatePromise(), timeoutPromise]);

      const response = result.response;
      const content = response.text();

      if (!content) {
        throw new Error('No content returned from Gemini');
      }

      // Extract JSON from the response
      let jsonString = '';
      const codeBlockRegex = /```json\n([\s\S]*?)\n```/;
      const jsonObjectRegex = /{[\s\S]*}/;
      const jsonArrayRegex = /\[\s*{[\s\S]*}\s*\]/;

      const codeBlockMatch = codeBlockRegex.exec(content);
      const jsonObjectMatch = jsonObjectRegex.exec(content);
      const jsonArrayMatch = jsonArrayRegex.exec(content);

      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1];
      } else if (jsonObjectMatch) {
        jsonString = jsonObjectMatch[0];
      } else if (jsonArrayMatch) {
        jsonString = jsonArrayMatch[0];
      } else {
        throw new Error('Could not extract JSON from Gemini response');
      }

      try {
        const parsedContent = JSON.parse(jsonString);

        // Handle both direct array or object with suggestions property
        const suggestions = Array.isArray(parsedContent) ? parsedContent : parsedContent.suggestions;

        if (!suggestions || !Array.isArray(suggestions)) {
          throw new Error('Invalid response format from Gemini');
        }

        return this.formatSuggestions(suggestions);
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        throw new Error('Failed to parse Gemini response');
      }
    } catch (error) {
      console.error('Gemini suggestion generation error:', error);
      throw error;
    }
  }

  async generatePrompt(request: AIPromptRequest): Promise<string> {
    try {
      const prompt = this.createPromptForGeneration(request);

      // Set a timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini request timed out')), 10000);
      });

      const generatePromise = async () => {
        try {
          const result = await this.model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000
            }
          });
          return result;
        } catch (error) {
          console.error('Gemini API error:', error);
          throw error;
        }
      };

      // Race between the API call and the timeout
      const result = await Promise.race([generatePromise(), timeoutPromise]);

      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini prompt generation error:', error);
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
    prompt += ' Format your response as a valid JSON object. Do not include any explanations or markdown formatting outside the JSON.';

    return prompt;
  }

  private createPromptForGeneration(request: AIPromptRequest): string {
    const { category, tone, audience, goal, components } = request;

    let prompt = 'Generate a prompt based on these requirements. Your response should ONLY include the prompt text itself with no additional explanations, introductions, or formatting:\n\n';

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
