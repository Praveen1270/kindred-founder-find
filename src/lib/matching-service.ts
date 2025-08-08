import { supabase } from '@/integrations/supabase/client';

export interface MatchResult {
  id: string;
  founder1_id: string;
  founder2_id: string;
  compatibility_score: number;
  match_reason: string | null;
  is_mutual: boolean;
  created_at: string;
  updated_at: string;
  matched_profile: {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    bio: string | null;
    linkedin_url: string | null;
    github_url: string | null;
    skills: string[];
  };
  matched_idea: {
    id: string;
    title: string;
    description: string;
    industry: string;
    stage: string;
    skills_needed: string[];
  };
}

export class MatchingService {
  static async generateMatches(): Promise<void> {
    try {
      const { error } = await supabase.rpc('generate_matches');
      if (error) throw error;
    } catch (error) {
      console.error('Error generating matches:', error);
      throw error;
    }
  }

  static async getMatchesForUser(userId: string): Promise<MatchResult[]> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          founder1:profiles!matches_founder1_id_fkey(*),
          founder2:profiles!matches_founder2_id_fkey(*),
          idea1:startup_ideas!startup_ideas_user_id_fkey(*),
          idea2:startup_ideas!startup_ideas_user_id_fkey(*)
        `)
        .or(`founder1_id.eq.${userId},founder2_id.eq.${userId}`);

      if (error) throw error;

      // Process matches to get the other founder's data
      const processedMatches = data?.map((match: any) => {
        const isFounder1 = match.founder1_id === userId;
        const matchedProfile = isFounder1 ? match.founder2 : match.founder1;
        const matchedIdea = isFounder1 ? match.idea2?.[0] : match.idea1?.[0];

        return {
          ...match,
          matched_profile: matchedProfile,
          matched_idea: matchedIdea,
        };
      }) || [];

      return processedMatches;
    } catch (error) {
      console.error('Error getting matches:', error);
      throw error;
    }
  }

  static async getAllProfiles(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          startup_idea:startup_ideas(*)
        `);

      if (error) throw error;

      const profilesWithIdeas = data?.filter(p => p.startup_idea && p.startup_idea.length > 0)
        .map(p => ({
          ...p,
          startup_idea: p.startup_idea[0],
        })) || [];

      return profilesWithIdeas;
    } catch (error) {
      console.error('Error getting profiles:', error);
      throw error;
    }
  }

  static async calculateCompatibilityScore(
    skills1: string[],
    skillsNeeded1: string[],
    skills2: string[],
    skillsNeeded2: string[],
    industry1: string,
    industry2: string,
    stage1: string,
    stage2: string
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_compatibility_score', {
        skills1,
        skills_needed1: skillsNeeded1,
        skills2,
        skills_needed2: skillsNeeded2,
        industry1,
        industry2,
        stage1,
        stage2,
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating compatibility score:', error);
      throw error;
    }
  }
} 