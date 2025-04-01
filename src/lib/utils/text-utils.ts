/**
 * Capitalizes the first letter of each word in a string
 * @param text The text to capitalize
 * @returns The capitalized text
 */
export function capitalizeTitle(text: string): string {
  if (!text) return '';
  
  // Split the text by spaces and capitalize each word
  return text
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Generates a title from prompt text
 * @param text The prompt text
 * @param category Optional category to include in the title
 * @returns A generated title
 */
export function generatePromptTitle(text: string, category?: string): string {
  // Extract first sentence or first 50 characters
  const firstSentence = text.split(/[.!?]\s/)[0];
  let title = firstSentence.length > 50
    ? firstSentence.substring(0, 47) + '...'
    : firstSentence;

  // Add category if provided and not already in the title
  if (category && !title.toLowerCase().includes(category.toLowerCase())) {
    title = `${capitalizeTitle(category)}: ${title}`;
  }

  // Capitalize the title
  return capitalizeTitle(title);
}
