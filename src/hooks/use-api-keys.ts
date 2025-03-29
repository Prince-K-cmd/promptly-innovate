
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type APIKey = {
  id: string;
  name: string;
  provider: string;
  key: string;
  created_at: string;
  user_id: string;
};

export const useApiKeys = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchApiKeys = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setApiKeys(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to fetch API keys",
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const addApiKey = async (keyData: Omit<APIKey, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          ...keyData,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      setApiKeys(prev => [...prev, data]);
      
      toast({
        title: "API key added",
        description: "Your new API key has been saved",
      });
      
      return data;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to add API key",
        description: error.message || "An unexpected error occurred",
      });
      return null;
    }
  };

  const updateApiKey = async (id: string, keyData: Partial<Omit<APIKey, 'id' | 'user_id'>>) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({
          ...keyData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Optimistically update local state
      setApiKeys(prev => prev.map(key => 
        key.id === id ? { ...key, ...keyData, updated_at: new Date().toISOString() } : key
      ));
      
      toast({
        title: "API key updated",
        description: "Your API key has been updated successfully",
      });
      
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update API key",
        description: error.message || "An unexpected error occurred",
      });
      return false;
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Remove from local state
      setApiKeys(prev => prev.filter(key => key.id !== id));
      
      toast({
        title: "API key deleted",
        description: "The API key has been removed successfully",
      });
      
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete API key",
        description: error.message || "An unexpected error occurred",
      });
      return false;
    }
  };

  const getApiKeyByProvider = (provider: string): APIKey | null => {
    return apiKeys.find(k => k.provider === provider) || null;
  };

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    } else {
      setApiKeys([]);
    }
  }, [user]);

  return {
    apiKeys,
    loading,
    fetchApiKeys,
    addApiKey,
    updateApiKey,
    deleteApiKey,
    getApiKeyByProvider,
  };
};
