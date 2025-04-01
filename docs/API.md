# Promptiverse - API Documentation

## Overview

Promptiverse uses Supabase as its backend service, which provides a RESTful API for data operations. This document outlines the key API endpoints and how to use them.

## Authentication

All authenticated requests require a valid JWT token obtained through Supabase authentication.

### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

## Prompts API

### Get All Prompts

Retrieves all prompts for the authenticated user.

```typescript
const { data, error } = await supabase
  .from('prompts')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Get Public Prompts

Retrieves all public prompts.

```typescript
const { data, error } = await supabase
  .from('prompts')
  .select('*')
  .eq('is_public', true)
  .order('created_at', { ascending: false });
```

### Get Prompt by ID

Retrieves a specific prompt by its ID.

```typescript
const { data, error } = await supabase
  .from('prompts')
  .select('*')
  .eq('id', promptId)
  .single();
```

### Create Prompt

Creates a new prompt.

```typescript
const { data, error } = await supabase
  .from('prompts')
  .insert({
    title: 'My Prompt',
    text: 'This is a prompt for creative writing.',
    category: 'creative_writing',
    description: 'A prompt to inspire creative writing.',
    tags: ['creative', 'writing', 'inspiration'],
    is_public: false,
  })
  .select()
  .single();
```

### Update Prompt

Updates an existing prompt.

```typescript
const { data, error } = await supabase
  .from('prompts')
  .update({
    title: 'Updated Prompt Title',
    text: 'Updated prompt text.',
  })
  .eq('id', promptId)
  .select()
  .single();
```

### Delete Prompt

Deletes a prompt.

```typescript
const { error } = await supabase
  .from('prompts')
  .delete()
  .eq('id', promptId);
```

## Categories API

### Get All Categories

Retrieves all available categories.

```typescript
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .order('name', { ascending: true });
```

### Create Category

Creates a new category.

```typescript
const { data, error } = await supabase
  .from('categories')
  .insert({
    name: 'New Category',
    description: 'Description of the new category',
  })
  .select()
  .single();
```

### Update Category

Updates an existing category.

```typescript
const { data, error } = await supabase
  .from('categories')
  .update({
    name: 'Updated Category Name',
    description: 'Updated category description',
  })
  .eq('id', categoryId)
  .select()
  .single();
```

### Delete Category

Deletes a category.

```typescript
const { error } = await supabase
  .from('categories')
  .delete()
  .eq('id', categoryId);
```

## Favorites API

### Get User Favorites

Retrieves all favorited prompts for the authenticated user.

```typescript
const { data, error } = await supabase
  .from('favorites')
  .select(`
    id,
    prompt_id,
    prompts (*)
  `)
  .eq('user_id', userId);
```

### Add to Favorites

Adds a prompt to the user's favorites.

```typescript
const { data, error } = await supabase
  .from('favorites')
  .insert({
    user_id: userId,
    prompt_id: promptId,
  })
  .select()
  .single();
```

### Remove from Favorites

Removes a prompt from the user's favorites.

```typescript
const { error } = await supabase
  .from('favorites')
  .delete()
  .eq('user_id', userId)
  .eq('prompt_id', promptId);
```

## API Keys API

### Get User API Keys

Retrieves all API keys for the authenticated user.

```typescript
const { data, error } = await supabase
  .from('api_keys')
  .select('id, provider, created_at, updated_at')
  .eq('user_id', userId);
```

### Add API Key

Adds a new API key for the user.

```typescript
const { data, error } = await supabase
  .from('api_keys')
  .insert({
    user_id: userId,
    provider: 'openai',
    api_key: 'sk-...',
  })
  .select('id, provider, created_at')
  .single();
```

### Update API Key

Updates an existing API key.

```typescript
const { data, error } = await supabase
  .from('api_keys')
  .update({
    api_key: 'sk-...',
  })
  .eq('id', keyId)
  .eq('user_id', userId)
  .select('id, provider, updated_at')
  .single();
```

### Delete API Key

Deletes an API key.

```typescript
const { error } = await supabase
  .from('api_keys')
  .delete()
  .eq('id', keyId)
  .eq('user_id', userId);
```

## AI Services API

The AI services are not direct Supabase endpoints but are implemented as client-side services that interact with external AI providers.

### Generate Prompt

Generates a prompt using the specified AI provider.

```typescript
// Using the AI service
const aiService = createAIService('openai', apiKey);
const prompt = await aiService.generatePrompt({
  category: 'creative_writing',
  tone: 'inspirational',
  audience: 'writers',
  goal: 'To inspire creative writing',
  components: {
    setting: 'A futuristic city',
    characters: 'A detective and an AI assistant',
  },
});
```

### Generate Suggestions

Generates suggestions for the prompt builder.

```typescript
// Using the AI service
const aiService = createAIService('openai', apiKey);
const suggestions = await aiService.generateSuggestions({
  category: 'creative_writing',
  tone: 'inspirational',
  audience: 'writers',
  step: 2, // 0: category, 1: tone, 2: audience, 3: components
});
```

## Error Handling

All API calls should include proper error handling:

```typescript
try {
  const { data, error } = await supabase.from('prompts').select('*');

  if (error) {
    throw error;
  }

  // Process data
  console.log(data);
} catch (error) {
  console.error('Error fetching prompts:', error.message);
  // Handle error appropriately
}
```

## Rate Limiting

- Supabase has rate limits that vary based on your plan
- External AI providers have their own rate limits:
  - OpenAI: Varies by tier and model
  - Google Gemini: Varies by tier
  - Groq: Varies by tier

## Security Considerations

- Never expose API keys in client-side code
- Use Row Level Security (RLS) policies in Supabase for data protection
- Validate all user inputs before sending to the API
- Implement proper error handling to avoid exposing sensitive information

## Pagination

For endpoints that may return large datasets, implement pagination:

```typescript
const { data, error, count } = await supabase
  .from('prompts')
  .select('*', { count: 'exact' })
  .range(0, 9) // First 10 items (0-9)
  .order('created_at', { ascending: false });

// For next page
const nextPageData = await supabase
  .from('prompts')
  .select('*')
  .range(10, 19) // Next 10 items (10-19)
  .order('created_at', { ascending: false });
```

## Filtering and Searching

### Filter by Category

```typescript
const { data, error } = await supabase
  .from('prompts')
  .select('*')
  .eq('category', 'creative_writing');
```

### Filter by Tags

```typescript
const { data, error } = await supabase
  .from('prompts')
  .select('*')
  .contains('tags', ['creative', 'writing']);
```

### Search by Text

```typescript
const { data, error } = await supabase
  .from('prompts')
  .select('*')
  .ilike('title', `%${searchTerm}%`);
```

## Real-time Subscriptions

Supabase supports real-time subscriptions for live updates:

```typescript
const subscription = supabase
  .channel('public:prompts')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'prompts' },
    (payload) => {
      console.log('Change received!', payload);
      // Update UI based on the change
    }
  )
  .subscribe();

// Unsubscribe when done
subscription.unsubscribe();
```

---

This API documentation is a reference guide and may be updated as the application evolves.
