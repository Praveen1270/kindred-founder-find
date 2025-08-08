import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  bio?: string;
  linkedin_url?: string;
  github_url?: string;
  skills: string[];
  created_at: string;
  updated_at: string;
}

interface StartupIdea {
  id: string;
  user_id: string;
  title: string;
  description: string;
  industry: string;
  stage: string;
  skills_needed: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [startupIdea, setStartupIdea] = useState<StartupIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (user) {
      checkProfile();
    }
  }, [user]);

  const checkProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profileData) {
        setProfile(profileData);
        setHasProfile(true);

        // Load startup idea
        const { data: ideaData, error: ideaError } = await supabase
          .from('startup_ideas')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (ideaError && ideaError.code !== 'PGRST116') {
          throw ideaError;
        }

        if (ideaData) {
          setStartupIdea(ideaData);
        }
      } else {
        setHasProfile(false);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const updateStartupIdea = async (updates: Partial<StartupIdea>) => {
    if (!user || !startupIdea) return;

    try {
      const { data, error } = await supabase
        .from('startup_ideas')
        .update(updates)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .select()
        .single();

      if (error) throw error;

      setStartupIdea(data);
      return data;
    } catch (error) {
      console.error('Error updating startup idea:', error);
      throw error;
    }
  };

  return {
    profile,
    startupIdea,
    loading,
    hasProfile,
    updateProfile,
    updateStartupIdea,
    refreshProfile: checkProfile,
  };
};