import { createAIService } from './ai';
import { AIPromptRequest } from './ai/types';
import { Prompt } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { capitalizeTitle, generatePromptTitle } from '@/lib/utils/text-utils';

// Cache key for localStorage
const SPOTLIGHT_CACHE_KEY = 'promptiverse_spotlight_prompt';
// Cache duration in milliseconds (4 hours)
const CACHE_DURATION = 4 * 60 * 60 * 1000;

// Categories for spotlight prompts
const SPOTLIGHT_CATEGORIES = [
  'creative_writing',
  'business',
  'academic',
  'coding',
  'marketing',
  'general'
];

// Tones for spotlight prompts
const SPOTLIGHT_TONES = [
  'professional',
  'friendly',
  'authoritative',
  'creative',
  'technical'
];

// Audiences for spotlight prompts
const SPOTLIGHT_AUDIENCES = [
  'general',
  'experts',
  'beginners',
  'business',
  'students'
];

// Generate a random prompt request
function generateRandomPromptRequest(): AIPromptRequest {
  return {
    category: SPOTLIGHT_CATEGORIES[Math.floor(Math.random() * SPOTLIGHT_CATEGORIES.length)],
    tone: SPOTLIGHT_TONES[Math.floor(Math.random() * SPOTLIGHT_TONES.length)],
    audience: SPOTLIGHT_AUDIENCES[Math.floor(Math.random() * SPOTLIGHT_AUDIENCES.length)],
    goal: 'Generate a high-quality, useful prompt for the Promptiverse spotlight feature',
    step: 3
  };
}

// Generate a title from the prompt text - using utility function
function generateTitle(text: string): string {
  return generatePromptTitle(text);
}

// Create a prompt object from generated text
function createPromptObject(text: string): Prompt {
  const now = new Date().toISOString();
  const randomCategory = SPOTLIGHT_CATEGORIES[Math.floor(Math.random() * SPOTLIGHT_CATEGORIES.length)];
  const title = generateTitle(text);

  return {
    id: 'spotlight-' + Date.now(),
    user_id: 'system',
    title: capitalizeTitle(title),
    text: text,
    category: randomCategory,
    tags: ['spotlight', 'featured', randomCategory],
    description: 'Auto-generated spotlight prompt that refreshes every 4 hours',
    is_public: true,
    created_at: now,
    updated_at: now
  };
}

// Fallback prompt in case AI generation fails
function getFallbackPrompt(): Prompt {
  const now = new Date().toISOString();
  return {
    id: 'spotlight-fallback',
    user_id: 'system',
    title: capitalizeTitle('Explain Complex Concepts Simply'),
    text: 'Describe a complex concept in simple terms that a 10-year-old would understand. Focus on using analogies and everyday examples to make the concept relatable and engaging.',
    category: 'general',
    tags: ['spotlight', 'featured', 'general'],
    description: 'Auto-generated spotlight prompt that refreshes every 4 hours',
    is_public: true,
    created_at: now,
    updated_at: now
  };
}

// Check if the cached prompt is still valid
function isCacheValid(cachedData: { timestamp: number, prompt: Prompt }): boolean {
  return Date.now() - cachedData.timestamp < CACHE_DURATION;
}

// Get API keys from Supabase
async function getApiKeys(): Promise<{ provider: string, key: string }[]> {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('provider, key');

    if (error) {
      console.error('Error fetching API keys:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getApiKeys:', error);
    return [];
  }
}

// Get spotlight prompt (from cache or generate new one)
export async function getSpotlightPrompt(): Promise<Prompt> {
  try {
    // Check cache first
    const cachedData = localStorage.getItem(SPOTLIGHT_CACHE_KEY);
    if (cachedData) {
      const parsedCache = JSON.parse(cachedData);
      if (isCacheValid(parsedCache)) {
        console.log('Using cached spotlight prompt');
        return parsedCache.prompt;
      }
    }

    // Get API keys
    const apiKeys = await getApiKeys();
    if (apiKeys.length === 0) {
      console.log('No API keys available, using fallback prompt');
      const fallbackPrompt = getFallbackPrompt();
      cachePrompt(fallbackPrompt);
      return fallbackPrompt;
    }

    // Try each available AI service until one succeeds
    for (const apiKey of apiKeys) {
      try {
        const service = createAIService(apiKey.provider, { apiKey: apiKey.key });
        if (!service?.generatePrompt) continue;

        const promptRequest = generateRandomPromptRequest();
        const generatedText = await service.generatePrompt(promptRequest);

        if (generatedText) {
          const prompt = createPromptObject(generatedText);
          cachePrompt(prompt);
          return prompt;
        }
      } catch (error) {
        console.error(`Error generating prompt with ${apiKey.provider}:`, error);
        // Continue to next provider
      }
    }

    // If all providers fail, use fallback
    const fallbackPrompt = getFallbackPrompt();
    cachePrompt(fallbackPrompt);
    return fallbackPrompt;
  } catch (error) {
    console.error('Error in getSpotlightPrompt:', error);
    return getFallbackPrompt();
  }
}

// Cache the prompt in localStorage
function cachePrompt(prompt: Prompt): void {
  try {
    localStorage.setItem(SPOTLIGHT_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      prompt
    }));
  } catch (error) {
    console.error('Error caching spotlight prompt:', error);
  }
}
