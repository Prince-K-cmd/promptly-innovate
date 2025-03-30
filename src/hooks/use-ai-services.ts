import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useApiKeys } from '@/hooks/use-api-keys';
import { AIService, AIServiceResponse, ChatMessage } from '@/services/ai/types';
import { ChatCompletionCreateParams } from 'openai/resources/chat/completions';
import * as OpenAIService from '@/services/ai/openai';
import * as GeminiService from '@/services/ai/gemini';
import * as GroqService from '@/services/ai/groq';

export const useAIServices = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { apiKeys } = useApiKeys();

  // Check if a service has an API key
  const hasApiKey = (service: AIService): boolean => {
    switch (service) {
      case 'openai':
        return !!apiKeys.openai;
      case 'gemini':
        return !!apiKeys.gemini;
      case 'groq':
        return !!apiKeys.groq;
      default:
        return false;
    }
  };

  // Get a list of available services (those with API keys)
  const getAvailableServices = (): AIService[] => {
    const services: AIService[] = [];
    if (hasApiKey('openai')) services.push('openai');
    if (hasApiKey('gemini')) services.push('gemini');
    if (hasApiKey('groq')) services.push('groq');
    return services;
  };

  // Get service to use based on preference and availability
  const getServiceToUse = (preferredService?: AIService): AIService | null => {
    // If a preferred service is specified and has an API key, use it
    if (preferredService && hasApiKey(preferredService)) {
      return preferredService;
    }

    // Otherwise, use the first available service
    const availableServices = getAvailableServices();
    if (availableServices.length > 0) {
      return availableServices[0];
    }

    // No services available
    return null;
  };

  // Generate a completion using a chat prompt
  const generateChatCompletion = async (
    messages: ChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      preferredService?: AIService;
    }
  ): Promise<AIServiceResponse> => {
    setLoading(true);
    setError(null);

    try {
      const serviceToUse = getServiceToUse(options?.preferredService);

      if (!serviceToUse) {
        toast({
          variant: "destructive",
          title: "No API Keys Available",
          description: "Please add API keys in the settings to use AI services.",
        });
        setLoading(false);
        return { success: false, text: '', error: 'No API keys available' };
      }

      let response: AIServiceResponse;

      switch (serviceToUse) {
        case 'openai':
          if (!apiKeys.openai) {
            toast({
              variant: "destructive",
              title: "OpenAI API Key Missing",
              description: "Please add your OpenAI API key in the settings.",
            });
            setLoading(false);
            return { success: false, text: '', error: 'OpenAI API key missing' };
          }

          const openaiParams: ChatCompletionCreateParams = {
            model: options?.model || 'gpt-3.5-turbo',
            messages: messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens,
          };

          response = await OpenAIService.createChatCompletion(apiKeys.openai, openaiParams);
          break;

        case 'gemini':
          if (!apiKeys.gemini) {
            toast({
              variant: "destructive",
              title: "Gemini API Key Missing",
              description: "Please add your Gemini API key in the settings.",
            });
            setLoading(false);
            return { success: false, text: '', error: 'Gemini API key missing' };
          }

          response = await GeminiService.createChatCompletion(
            apiKeys.gemini,
            messages,
            options?.temperature ?? 0.7,
            options?.maxTokens,
            options?.model || 'gemini-pro'
          );
          break;

        case 'groq':
          if (!apiKeys.groq) {
            toast({
              variant: "destructive",
              title: "Groq API Key Missing",
              description: "Please add your Groq API key in the settings.",
            });
            setLoading(false);
            return { success: false, text: '', error: 'Groq API key missing' };
          }

          response = await GroqService.createChatCompletion(
            apiKeys.groq,
            messages,
            options?.model || 'llama3-8b-8192',
            options?.temperature ?? 0.7,
            options?.maxTokens
          );
          break;

        default:
          toast({
            variant: "destructive",
            title: "Unsupported AI Service",
            description: "The selected AI service is not supported.",
          });
          setLoading(false);
          return { success: false, text: '', error: 'Unsupported AI service' };
      }

      if (!response.success) {
        toast({
          variant: "destructive",
          title: "AI Generation Failed",
          description: response.error || "Failed to generate text.",
        });
      }

      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "AI Generation Error",
        description: errorMessage,
      });
      return { success: false, text: '', error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Improve a prompt using OpenAI
  const improvePrompt = async (
    promptText: string,
    promptPurpose: string,
    preferredService?: AIService
  ): Promise<string> => {
    const response = await generateChatCompletion(
      [
        {
          role: 'system',
          content: `You are an expert prompt engineer. Your task is to improve the provided prompt based on its intended purpose. Make the prompt clearer, more specific, and more likely to produce the desired output. Focus on adding details, removing ambiguities, and structuring the prompt effectively. Return ONLY the improved prompt text without explanations or additional commentary.`
        },
        {
          role: 'user',
          content: `Original Prompt: "${promptText}"\n\nPurpose of this prompt: ${promptPurpose}\n\nPlease improve this prompt to better achieve its purpose.`
        }
      ],
      { 
        temperature: 0.7,
        preferredService 
      }
    );

    return response.success ? response.text : promptText;
  };

  // Generate ideas for prompt purpose
  const generatePurposeIdeas = async (
    preferredService?: AIService
  ): Promise<string[]> => {
    const response = await generateChatCompletion(
      [
        {
          role: 'system',
          content: `You are a helpful assistant specialized in AI prompt engineering. Generate a list of 5 interesting and diverse prompt purposes that users might want to create prompts for. These should cover different domains like creative writing, coding, business, education, etc. Return ONLY the numbered list without any introduction or additional text. Each idea should be concise (10 words or less).`
        }
      ],
      { 
        temperature: 0.9,
        preferredService 
      }
    );

    if (!response.success) {
      return [];
    }

    // Parse the response to get individual ideas
    const ideas = response.text
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 5);

    return ideas;
  };

  return {
    loading,
    error,
    hasApiKey,
    getAvailableServices,
    generateChatCompletion,
    improvePrompt,
    generatePurposeIdeas
  };
};
