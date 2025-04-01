# AI Models in Promptiverse

## Overview

Promptiverse integrates with multiple AI providers to offer a flexible and robust prompt generation experience. This document provides information about the AI models used, their capabilities, and how they're integrated into the application.

## Supported AI Providers

### OpenAI

**Models Used:**
- GPT-3.5 Turbo (`gpt-3.5-turbo`)
- GPT-4 (`gpt-4`) - If user has access

**Key Features:**
- High-quality text generation
- Strong understanding of context and nuance
- Excellent for creative and technical content
- Support for JSON mode for structured outputs

**Integration:**
- Used for generating prompt suggestions
- Used for creating final prompts
- Supports system prompts for better guidance

**API Documentation:**
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

### Google Gemini

**Models Used:**
- Gemini Pro (`gemini-pro`)

**Key Features:**
- Strong reasoning capabilities
- Good at following complex instructions
- Efficient performance
- Multimodal capabilities (though not used in current implementation)

**Integration:**
- Used as an alternative to OpenAI for prompt generation
- Used for generating suggestions in the prompt builder
- Falls back to this model if OpenAI is unavailable

**API Documentation:**
- [Google AI Gemini API](https://ai.google.dev/docs/gemini_api_overview)

### Groq

**Models Used:**
- LLaMA 2 70B (`llama2-70b-4096`)
- Mixtral 8x7B (`mixtral-8x7b-32768`)

**Key Features:**
- Extremely fast inference times
- Open-weights models
- Good performance on structured tasks
- High token context windows

**Integration:**
- Used as a high-speed alternative to other providers
- Particularly useful for generating multiple suggestions quickly
- Falls back to this model if other providers are unavailable

**API Documentation:**
- [Groq API Documentation](https://console.groq.com/docs/quickstart)

## AI Service Architecture

The application uses a provider-agnostic architecture that allows seamless switching between AI providers:

```ascii
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  OpenAI Service │     │ Gemini Service  │     │  Groq Service   │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────┬───────────────────────┬──────┘
                         │                       │
                ┌────────▼────────┐     ┌────────▼────────┐
                │                 │     │                 │
                │  AI Interface   │     │  API Key Store  │
                │                 │     │                 │
                └────────┬────────┘     └────────┬────────┘
                         │                       │
                         └───────────┬───────────┘
                                     │
                           ┌─────────▼─────────┐
                           │                   │
                           │  useAIServices    │
                           │      Hook         │
                           │                   │
                           └─────────┬─────────┘
                                     │
                           ┌─────────▼─────────┐
                           │                   │
                           │  React Components │
                           │                   │
                           └───────────────────┘
```

## Prompt Engineering Techniques

The application uses several advanced prompt engineering techniques:

### System Prompts

Each AI request includes a carefully crafted system prompt that guides the model's behavior:

```typescript
// Example system prompt for generating prompts
const systemPrompt = `You are an expert prompt engineer who creates highly effective prompts.
Your prompts are:
- Clear and direct with precise instructions
- Concise but include all necessary context
- General and adaptable to different scenarios
- Free of unnecessary introductions or explanations
- Straight to the point without assuming specific use cases

Avoid making assumptions about how the prompt will be used.
Your output should ONLY include the prompt text itself with no additional explanations or formatting.`;
```

### Shot Prompting

For complex categories, the application uses shot prompting (providing examples):

```typescript
// Example of shot prompting for coding prompts
const shotPromptExample = `
Examples of effective coding prompts:

Example 1:
Create a JavaScript function that takes an array of objects representing tasks with properties: id, title, priority (high/medium/low), and completed (boolean). The function should:
1. Filter out completed tasks
2. Sort remaining tasks by priority (high first, low last)
3. Return an array containing only the titles of these tasks
Include error handling for invalid inputs and provide a brief explanation of your approach.

Example 2:
Write a Python class for a simple banking system that handles accounts with the following requirements:
- Each account has an ID, owner name, balance, and creation date
- Methods for deposit, withdrawal (with insufficient funds validation)
- A static method to transfer between accounts
- A method to calculate interest based on account age
Include appropriate error handling and demonstrate usage with example code.`;
```

### Structured Output

For suggestions and other structured data, the application requests JSON output:

```typescript
// Example of requesting structured output
const prompt = `Generate 5 suggestions for prompt categories.
Return a JSON object with an array called "suggestions" containing EXACTLY 5 items.
Each item must have "type" (set to "category"), "value" (the category name), and "text" (a description).
Format your response as a valid JSON object. Do not include any explanations outside the JSON.`;
```

## Fallback Mechanism

The application implements a robust fallback mechanism:

1. First attempts to use the user's preferred AI provider
2. If that fails or is unavailable, tries the next available provider
3. Continues until a successful response is received or all providers fail
4. Provides appropriate error messages if all providers fail

```typescript
// Simplified fallback mechanism
async function generateWithFallback(request) {
  const providers = ['openai', 'gemini', 'groq'];

  for (const provider of providers) {
    if (hasApiKey(provider)) {
      try {
        const service = createAIService(provider);
        return await service.generatePrompt(request);
      } catch (error) {
        console.error(`${provider} failed:`, error);
        // Continue to next provider
      }
    }
  }

  throw new Error('All available AI providers failed');
}
```

## Best Practices for AI Integration

The application follows these best practices:

1. **User Control**: Users can choose which AI provider to use
2. **Transparency**: Clear indication of which AI provider is being used
3. **Privacy**: API keys are stored securely and not shared
4. **Error Handling**: Robust error handling for AI service failures
5. **Fallbacks**: Graceful degradation when services are unavailable
6. **Efficiency**: Optimized prompts to reduce token usage
7. **Consistency**: Unified interface across different AI providers

## Future AI Enhancements

Planned enhancements for AI integration:

1. **Function Calling**: Implementing OpenAI's function calling for more structured outputs
2. **Multimodal Support**: Adding support for image inputs with Gemini's multimodal capabilities
3. **Fine-tuning**: Exploring fine-tuned models for better prompt generation
4. **Additional Providers**: Adding support for more AI providers
5. **Advanced Caching**: Implementing more sophisticated caching strategies
6. **Streaming Responses**: Adding support for streaming responses for a better user experience

---

This document will be updated as new AI models and features are integrated into the application.
