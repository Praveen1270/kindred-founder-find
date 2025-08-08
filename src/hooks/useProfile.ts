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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkProfile();
    } else {
      setLoading(false);
      setHasProfile(false);
    }
  }, [user]);

  const checkProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Handle database errors gracefully
      if (profileError) {
        // If it's a table doesn't exist error, treat as no profile
        if (profileError.code === '42P01' || profileError.message.includes('relation "profiles" does not exist')) {
          console.log('Database tables not set up yet - treating as no profile');
          setHasProfile(false);
          setLoading(false);
          return;
        }
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
          // Only throw if it's not a "not found" error
          if (!ideaError.message.includes('relation "startup_ideas" does not exist')) {
            throw ideaError;
          }
        }

        if (ideaData) {
          setStartupIdea(ideaData);
        }
      } else {
        setHasProfile(false);
      }
    } catch (error: any) {
      console.error('Error checking profile:', error);
      setError(error.message);
      // Don't set hasProfile to false here, let the user try again
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
    error,
    updateProfile,
    updateStartupIdea,
    refreshProfile: checkProfile,
  };
};