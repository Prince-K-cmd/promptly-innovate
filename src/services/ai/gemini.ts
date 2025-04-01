import { AIService, AIPromptRequest, AISuggestion, AIServiceConfig } from './types';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import {
  shouldUseShotPrompting,
  getShotPromptingExamples,
  createTailoredSuggestionsPrompt
} from '@/lib/utils/prompt-templates';

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
