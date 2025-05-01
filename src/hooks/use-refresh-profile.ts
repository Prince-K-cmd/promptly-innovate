
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types/auth.types';

export const useRefreshProfile = () => {
  const [lastProfileRefresh, setLastProfileRefresh] = useState<number>(0);

  // Function to refresh the profile data
  const refreshProfile = async (
    user: User | null,
    setProfile: (profile: Profile | null) => void,
    force = false
  ) => {
    if (!user) return;

    // Prevent excessive refreshes by checking the time since last refresh
    // Only refresh if forced or if it's been more than 2 seconds since the last refresh
    const now = Date.now();
    if (!force && now - lastProfileRefresh < 2000) {
      console.log("Skipping profile refresh - too soon");
      return;
    }

    try {
      setLastProfileRefresh(now);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Error refreshing profile:", error);
        return;
      }

      if (profileData) {
        console.log("Profile refreshed:", profileData);
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  return { refreshProfile };
};
