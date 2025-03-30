
export enum AIService {
  OpenAI = 'openai',
  Gemini = 'gemini',
  Groq = 'groq'
}

export enum AIModel {
  GPT35Turbo = 'gpt-3.5-turbo',
  GPT4 = 'gpt-4',
  GPT4Turbo = 'gpt-4-turbo-preview',
  GeminiPro = 'gemini-pro',
  LLama2 = 'llama2-70b-chat',
  Claude = 'claude-instant-1'
}

export interface AIProvider {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  models: string[];
  defaultModel: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AISuggestion {
  type: string;
  value: string;
  text: string;
  snippet?: any;
}

export interface AIServiceResponse {
  text: string;
  model: string;
  service: AIService;
}

export interface AISettings {
  model: string;
  temperature: number;
  maxTokens: number;
  service: AIService;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  model: AIModel.GPT35Turbo,
  temperature: 0.7,
  maxTokens: 500,
  service: AIService.OpenAI
};

export const AI_PROVIDERS: Record<AIService, AIProvider> = {
  [AIService.OpenAI]: {
    id: 'openai',
    name: 'OpenAI',
    description: 'Powerful models for various AI tasks',
    models: [AIModel.GPT35Turbo, AIModel.GPT4, AIModel.GPT4Turbo],
    defaultModel: AIModel.GPT35Turbo
  },
  [AIService.Gemini]: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google\'s multimodal AI model',
    models: [AIModel.GeminiPro],
    defaultModel: AIModel.GeminiPro
  },
  [AIService.Groq]: {
    id: 'groq',
    name: 'Groq',
    description: 'Fast inference API for LLMs',
    models: [AIModel.LLama2, AIModel.GPT4, AIModel.Claude],
    defaultModel: AIModel.LLama2
  }
};
