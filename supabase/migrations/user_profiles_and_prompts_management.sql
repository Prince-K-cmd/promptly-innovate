-- Create tables for profiles and prompts
-- Profiles table to store user information
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
-- Prompts table to store all prompts
CREATE TABLE public.prompts (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT [] DEFAULT '{}',
    description TEXT,
    is_public BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
-- Create function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (id, username, avatar_url)
VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            split_part(NEW.email, '@', 1)
        ),
        CONCAT(
            'https://api.dicebear.com/7.x/identicon/svg?seed=',
            split_part(NEW.email, '@', 1)
        )
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Set up Row Level Security (RLS) policies
-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Profiles policies
CREATE POLICY "Users can view any profile" ON public.profiles FOR
SELECT TO authenticated,
    anon USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR
UPDATE TO authenticated USING (auth.uid() = id);
-- Enable RLS on prompts
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
-- Prompts policies
CREATE POLICY "Users can view public prompts" ON public.prompts FOR
SELECT TO authenticated,
    anon USING (is_public = true);
CREATE POLICY "Users can view their own prompts" ON public.prompts FOR
SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create prompts" ON public.prompts FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own prompts" ON public.prompts FOR
UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own prompts" ON public.prompts FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- Set up Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);
-- Storage RLS policy for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR
SELECT TO anon USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatar images" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
CREATE POLICY "Users can update their own avatar images" ON storage.objects FOR
UPDATE TO authenticated USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
CREATE POLICY "Users can delete their own avatar images" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name)) [1] = auth.uid()::text
);