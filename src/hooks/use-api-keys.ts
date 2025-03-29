
import { useState, useEffect } from 'react';
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
      // For demo purposes, we'll check localStorage
      const storedKeys = localStorage.getItem(`api_keys_${user.id}`);
      if (storedKeys) {
        setApiKeys(JSON.parse(storedKeys));
      } else {
        setApiKeys([]);
      }
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
      // Store in localStorage
      const newKey: APIKey = {
        id: `key_${Date.now().toString(36)}`,
        ...keyData,
        created_at: new Date().toISOString(),
        user_id: user.id,
      };
      
      const updatedKeys = [...apiKeys, newKey];
      localStorage.setItem(`api_keys_${user.id}`, JSON.stringify(updatedKeys));
      setApiKeys(updatedKeys);
      
      toast({
        title: "API key added",
        description: "Your new API key has been saved",
      });
      
      return newKey;
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
      // Update in localStorage
      const updatedKeys = apiKeys.map(key => 
        key.id === id ? { ...key, ...keyData } : key
      );
      
      localStorage.setItem(`api_keys_${user.id}`, JSON.stringify(updatedKeys));
      setApiKeys(updatedKeys);
      
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
      // Delete from localStorage
      const updatedKeys = apiKeys.filter(key => key.id !== id);
      localStorage.setItem(`api_keys_${user.id}`, JSON.stringify(updatedKeys));
      setApiKeys(updatedKeys);
      
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
    if (!apiKeys.length) return null;
    
    const key = apiKeys.find(k => k.provider === provider);
    return key || null;
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
