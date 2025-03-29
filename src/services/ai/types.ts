// AI Service Types
export interface AISuggestion {
  type: string;
  value: string;
  text: string;
  snippet?: any;
}

export interface AIPromptRequest {
  category?: string;
  tone?: string;
  audience?: string;
  goal?: string;
  components?: Record<string, string>;
  step: number; // Current step in the prompt builder
}

export interface AIServiceConfig {
  apiKey: string;
  model?: string;
}

export interface AIService {
  generateSuggestions(request: AIPromptRequest): Promise<AISuggestion[]>;
  generatePrompt?(request: AIPromptRequest): Promise<string>;
}
