
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useProfile = () => {
  const { user, profile: authProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Function to update user profile
  const updateProfile = async (updates: {
    username?: string;
    full_name?: string;
    bio?: string;
    website?: string;
  }) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to update your profile.",
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select();

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      return data?.[0] || null;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update profile",
        description: error.message || "An error occurred",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Function to upload profile image
  const uploadAvatar = async (file: File) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to upload an avatar.",
      });
      return null;
    }

    setLoading(true);
    try {
      // Upload the image
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      // Ensure path follows the format expected by the RLS policy: avatars/{user_id}/{filename}
      const filePath = `${user.id}/${fileName}`;

      console.log("Uploading to path:", filePath);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log("Public URL generated:", publicUrl);

      // Update the profile with the new avatar URL
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
        .select();

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw updateError;
      }

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      });

      return data?.[0] || null;
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({
        variant: "destructive",
        title: "Failed to update avatar",
        description: error.message || "An error occurred",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile: authProfile,
    loading,
    updateProfile,
    uploadAvatar,
  };
};
