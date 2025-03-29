
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Key, Eye, EyeOff, Plus, Lock, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const apiKeyFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider: z.string().min(1, "Provider is required"),
  key: z.string().min(1, "API key is required"),
});

type APIKey = {
  id: string;
  name: string;
  provider: string;
  key: string;
  created_at: string;
};

type APIKeyFormValues = z.infer<typeof apiKeyFormSchema>;

const APIKeysManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [showingKeys, setShowingKeys] = useState<Record<string, boolean>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const form = useForm<APIKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      name: "",
      provider: "openai",
      key: "",
    },
  });

  React.useEffect(() => {
    if (user) {
      loadApiKeys();
    }
  }, [user]);

  const loadApiKeys = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Try to load API keys from localStorage first (for demo purposes)
      const storedKeys = localStorage.getItem(`api_keys_${user.id}`);
      if (storedKeys) {
        setApiKeys(JSON.parse(storedKeys));
      } else {
        // In a real app, you would fetch from Supabase
        const { data, error } = await supabase
          .from('api_keys')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) throw error;
        if (data) setApiKeys(data);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to load API keys",
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleKeyVisibility = (id: string) => {
    setShowingKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const startEditing = (key: APIKey) => {
    setEditingKey(key.id);
    form.reset({
      name: key.name,
      provider: key.provider,
      key: key.key,
    });
  };

  const cancelEditing = () => {
    setEditingKey(null);
    form.reset({
      name: "",
      provider: "openai",
      key: "",
    });
  };

  const handleDeleteKey = async (id: string) => {
    if (!user) return;
    
    try {
      // For demo purposes, we'll just update localStorage
      const updatedKeys = apiKeys.filter(key => key.id !== id);
      localStorage.setItem(`api_keys_${user.id}`, JSON.stringify(updatedKeys));
      setApiKeys(updatedKeys);
      
      // In a real app, you would delete from Supabase
      // const { error } = await supabase
      //   .from('api_keys')
      //   .delete()
      //   .eq('id', id)
      //   .eq('user_id', user.id);
      
      // if (error) throw error;
      
      toast({
        title: "API key deleted",
        description: "The API key has been removed successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete API key",
        description: error.message || "An unexpected error occurred",
      });
    }
  };

  const onSubmit = async (values: APIKeyFormValues) => {
    if (!user) return;
    
    try {
      if (editingKey) {
        // Update existing key
        const updatedKeys = apiKeys.map(key => 
          key.id === editingKey 
            ? { ...key, ...values, key: values.key } 
            : key
        );
        
        localStorage.setItem(`api_keys_${user.id}`, JSON.stringify(updatedKeys));
        setApiKeys(updatedKeys);
        
        // In a real app, you would update in Supabase
        // const { error } = await supabase
        //   .from('api_keys')
        //   .update({ name: values.name, provider: values.provider, key: values.key })
        //   .eq('id', editingKey)
        //   .eq('user_id', user.id);
        
        // if (error) throw error;
        
        toast({
          title: "API key updated",
          description: "Your API key has been updated successfully",
        });
        
        setEditingKey(null);
      } else {
        // Create new key
        const newKey: APIKey = {
          id: `key_${Date.now().toString(36)}`,
          name: values.name,
          provider: values.provider,
          key: values.key,
          created_at: new Date().toISOString(),
        };
        
        const updatedKeys = [...apiKeys, newKey];
        localStorage.setItem(`api_keys_${user.id}`, JSON.stringify(updatedKeys));
        setApiKeys(updatedKeys);
        
        // In a real app, you would insert into Supabase
        // const { error } = await supabase
        //   .from('api_keys')
        //   .insert({
        //     name: values.name,
        //     provider: values.provider,
        //     key: values.key,
        //     user_id: user.id,
        //   });
        
        // if (error) throw error;
        
        toast({
          title: "API key added",
          description: "Your new API key has been saved",
        });
      }
      
      form.reset({
        name: "",
        provider: "openai",
        key: "",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to save API key",
        description: error.message || "An unexpected error occurred",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key size={18} />
            <span>{editingKey ? "Edit API Key" : "Add New API Key"}</span>
          </CardTitle>
          <CardDescription>
            Add your AI service provider API keys to enable AI features in the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My OpenAI Key" {...field} />
                    </FormControl>
                    <FormDescription>
                      A friendly name to identify this API key
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                        <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                        <SelectItem value="gemini">Google (Gemini)</SelectItem>
                        <SelectItem value="groq">Groq</SelectItem>
                        <SelectItem value="perplexity">Perplexity</SelectItem>
                        <SelectItem value="custom">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The AI service provider for this API key
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input
                        type="password" 
                        placeholder="sk-..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Your API key will be encrypted and stored securely
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-2">
                {editingKey && (
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={cancelEditing}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit">
                  {editingKey ? "Update Key" : "Add Key"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock size={18} />
            <span>Your API Keys</span>
          </CardTitle>
          <CardDescription>
            Manage your saved API keys for different AI providers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading your API keys...</div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>You haven't added any API keys yet.</p>
              <p className="text-sm mt-2">Add your first API key using the form above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div 
                  key={apiKey.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-md"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{apiKey.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {apiKey.provider}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span className="font-mono">
                        {showingKeys[apiKey.id] 
                          ? apiKey.key 
                          : apiKey.key.substring(0, 3) + "..." + apiKey.key.substring(apiKey.key.length - 4)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {showingKeys[apiKey.id] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Added on {new Date(apiKey.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditing(apiKey)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteKey(apiKey.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default APIKeysManager;
