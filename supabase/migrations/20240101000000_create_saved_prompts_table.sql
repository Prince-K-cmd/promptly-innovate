-- Create a table to track saved prompts (community prompts that users have added to their collection)
CREATE TABLE IF NOT EXISTS public.saved_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, prompt_id)
);

-- Add RLS policies
ALTER TABLE public.saved_prompts ENABLE ROW LEVEL SECURITY;

-- Users can only view their own saved prompts
CREATE POLICY "Users can view their own saved prompts" 
    ON public.saved_prompts 
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

-- Users can insert their own saved prompts
CREATE POLICY "Users can insert their own saved prompts" 
    ON public.saved_prompts 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved prompts
CREATE POLICY "Users can delete their own saved prompts" 
    ON public.saved_prompts 
    FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS saved_prompts_user_id_idx ON public.saved_prompts (user_id);
CREATE INDEX IF NOT EXISTS saved_prompts_prompt_id_idx ON public.saved_prompts (prompt_id);
