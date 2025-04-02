
import { Database } from '@/integrations/supabase/types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Prompt = Database['public']['Tables']['prompts']['Row'] & {
  updated_at: string;
};
export type PromptTemplate = Database['public']['Tables']['prompt_templates']['Row'];
export type PromptSnippet = Database['public']['Tables']['prompt_snippets']['Row'];
export type PromptBuildingHistory = Database['public']['Tables']['prompt_building_history']['Row'];

export type Category = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
};
