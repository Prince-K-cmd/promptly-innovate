/**
 * Utility functions and templates for generating effective AI prompts
 */

/**
 * Determines if shot prompting should be used based on the request context
 * @param category The prompt category
 * @param components Any specific components provided
 * @returns Whether to use shot prompting
 */
export function shouldUseShotPrompting(
  category?: string,
  components?: Record<string, string>
): boolean {
  // Use shot prompting for specific categories that benefit from examples
  const shotPromptingCategories = [
    'creative_writing',
    'coding',
    'academic',
    'marketing'
  ];

  // Check if category is one that benefits from shot prompting
  if (category && shotPromptingCategories.includes(category)) {
    return true;
  }

  // Check if components indicate complexity that would benefit from examples
  if (components) {
    const componentValues = Object.values(components);
    // If there are multiple detailed components, shot prompting helps
    if (componentValues.length >= 2 &&
        componentValues.some(v => v && v.length > 30)) {
      return true;
    }
  }

  return false;
}

/**
 * Creates a system prompt for generating high-quality prompts
 * @returns System prompt for the AI
 */
export function createSystemPrompt(): string {
  return `You are an expert prompt engineer who creates highly effective prompts.
Your prompts are:
- Clear and direct with precise instructions
- Concise but include all necessary context
- General and adaptable to different scenarios
- Free of unnecessary introductions or explanations
- Straight to the point without assuming specific use cases

Avoid making assumptions about how the prompt will be used.
Your output should ONLY include the prompt text itself with no additional explanations or formatting.`;
}

/**
 * Creates a system prompt for generating suggestions
 * @returns System prompt for the AI
 */
export function createSuggestionsSystemPrompt(): string {
  return `You are an expert prompt engineer who provides insightful, creative, and highly relevant suggestions.
Your suggestions should be:
- Specific and actionable
- Diverse and cover different approaches
- Tailored to the user's current context and previous selections
- Designed to enhance the effectiveness of the final prompt
- Presented in clear, concise language

Respond in JSON format only with exactly 5 suggestions.`;
}

/**
 * Generates examples for shot prompting based on category
 * @param category The prompt category
 * @returns Example prompts for the category
 */
export function getShotPromptingExamples(category?: string): string {
  if (!category) return '';

  switch (category) {
    case 'creative_writing':
      return `
Examples of effective creative writing prompts:

Example 1:
Write a short story about a character who discovers an unusual object that grants a specific power, but with an unexpected limitation. Include a moment of realization when the character understands the true nature of this power. End with either the character embracing or rejecting this power.

Example 2:
Create a dialogue between two characters with opposing viewpoints on a moral dilemma. One character should gradually change their perspective through the conversation. Use minimal dialogue tags and rely on the characters' distinct voices and word choices to convey their personalities.`;

    case 'coding':
      return `
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

    case 'academic':
      return `
Examples of effective academic prompts:

Example 1:
Analyze the key factors contributing to climate change from both natural and anthropogenic sources. For each factor, evaluate:
1. The scientific evidence supporting its impact
2. The relative contribution to overall warming
3. The timeframe of its effects
Conclude with an assessment of which factors should be prioritized in mitigation strategies and why.

Example 2:
Compare and contrast two major theoretical frameworks in cognitive psychology: Information Processing Theory and Embodied Cognition. For each framework:
1. Outline its core principles and historical development
2. Evaluate its explanatory power for specific cognitive phenomena
3. Identify methodological approaches associated with each
4. Assess limitations and criticisms
Conclude by discussing how these frameworks might be integrated or where one might be more applicable than the other.`;

    case 'marketing':
      return `
Examples of effective marketing prompts:

Example 1:
Create a comprehensive content marketing strategy for a new plant-based protein product targeting health-conscious millennials. Include:
1. Content pillars and themes aligned with audience pain points
2. Channel-specific content formats (social, blog, email, video)
3. A content calendar framework for a 3-month launch period
4. KPIs to measure content effectiveness
5. Suggestions for user-generated content opportunities

Example 2:
Develop a social media campaign concept for a local bookstore looking to increase foot traffic and online orders. Include:
1. Campaign theme and hashtag
2. Content ideas for Instagram, TikTok, and Facebook
3. Engagement tactics to encourage community participation
4. Promotional structure (contests, discounts, events)
5. Ideas to convert social engagement to store visits or purchases`;

    default:
      return '';
  }
}

/**
 * Creates a prompt for generating final step suggestions that are tailored to the user's inputs
 * @param category The prompt category
 * @param tone The selected tone
 * @param audience The target audience
 * @param components Any specific components provided
 * @returns A prompt for generating tailored suggestions
 */
export function createTailoredSuggestionsPrompt(
  category?: string,
  tone?: string,
  audience?: string,
  components?: Record<string, string>
): string {
  let prompt = `Generate 5 concise, effective suggestions to enhance this prompt.
The user is building a ${category || 'general'} prompt`;

  if (tone) {
    prompt += ` with a ${tone} tone`;
  }

  if (audience) {
    prompt += ` for a ${audience} audience`;
  }

  prompt += `.

Suggest 5 elements that would make this prompt more effective and direct.
Your suggestions should be concise, general, and straight to the point.`;

  if (components && Object.keys(components).length > 0) {
    prompt += `\n\nThe user has already included these components:\n`;
    Object.entries(components).forEach(([key, value]) => {
      if (value) {
        prompt += `- ${key}: ${value}\n`;
      }
    });

    prompt += `\nYour suggestions should complement these existing components, not repeat them.`;
  }

  prompt += `\n\nEach suggestion should:
1. Be general and adaptable
2. Avoid assuming specific use cases
3. Be concise and direct
4. Add clear value to the prompt

Return a JSON object with an array called "suggestions" containing EXACTLY 5 items.
Each item must have "type" (set to "snippet"), "value" (a short version), and "text" (a detailed description).
Format your response as a valid JSON object. Do not include any explanations outside the JSON.`;

  return prompt;
}
