import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Mail, Phone, ExternalLink, Users, Lightbulb, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
}

interface StartupIdea {
  id: string;
  title: string;
  description: string;
  industry: string;
  stage: string;
  skills_needed: string[];
}

interface Match {
  id: string;
  compatibility_score: number;
  founder1_id: string;
  founder2_id: string;
  matched_profile: Profile;
  matched_idea: StartupIdea;
}

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [startupIdea, setStartupIdea] = useState<StartupIdea | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [allProfiles, setAllProfiles] = useState<(Profile & { startup_idea: StartupIdea })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadMatches();
      loadAllProfiles();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load startup idea
      const { data: ideaData, error: ideaError } = await supabase
        .from('startup_ideas')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (ideaError) throw ideaError;
      setStartupIdea(ideaData);
    } catch (error: any) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    if (!user) return;

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
        .or(`founder1_id.eq.${user.id},founder2_id.eq.${user.id}`);

      if (error) throw error;

      // Process matches to get the other founder's data
      const processedMatches = data?.map((match: any) => {
        const isFounder1 = match.founder1_id === user.id;
        const matchedProfile = isFounder1 ? match.founder2 : match.founder1;
        const matchedIdea = isFounder1 ? match.idea2?.[0] : match.idea1?.[0];

        return {
          ...match,
          matched_profile: matchedProfile,
          matched_idea: matchedIdea,
        };
      }) || [];

      setMatches(processedMatches);
    } catch (error: any) {
      console.error('Error loading matches:', error);
    }
  };

  const loadAllProfiles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          startup_idea:startup_ideas(*)
        `)
        .neq('user_id', user.id);

      if (error) throw error;

      const profilesWithIdeas = data?.filter(p => p.startup_idea && p.startup_idea.length > 0)
        .map(p => ({
          ...p,
          startup_idea: p.startup_idea[0],
        })) || [];

      setAllProfiles(profilesWithIdeas);
    } catch (error: any) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">FounderCollab</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {profile?.full_name}!</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="matches">Matches ({matches.length})</TabsTrigger>
            <TabsTrigger value="search">Search Founders</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{matches.length}</div>
                  <p className="text-xs text-muted-foreground">
                    +2 from last week
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Idea Stage</CardTitle>
                  <Lightbulb className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{startupIdea?.stage}</div>
                  <p className="text-xs text-muted-foreground">
                    {startupIdea?.industry}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Founders</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allProfiles.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Actively looking for co-founders
                  </p>
                </CardContent>
              </Card>
            </div>

            {startupIdea && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Startup Idea</CardTitle>
                  <CardDescription>{startupIdea.industry} • {startupIdea.stage}</CardDescription>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold mb-2">{startupIdea.title}</h3>
                  <p className="text-muted-foreground mb-4">{startupIdea.description}</p>
                  <div>
                    <p className="text-sm font-medium mb-2">Skills you need:</p>
                    <div className="flex flex-wrap gap-2">
                      {startupIdea.skills_needed.map((skill) => (
                        <Badge key={skill} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.map((match) => (
                <Card key={match.id}>
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(match.matched_profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{match.matched_profile.full_name}</CardTitle>
                        <CardDescription>
                          {match.compatibility_score}% match
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold">{match.matched_idea.title}</h4>
                      <p className="text-sm text-muted-foreground">{match.matched_idea.industry} • {match.matched_idea.stage}</p>
                      <p className="text-sm mt-2">{match.matched_idea.description.substring(0, 100)}...</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Their skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {match.matched_profile.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                        {match.matched_profile.skills.length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{match.matched_profile.skills.length - 3} more</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Mail className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                      {match.matched_profile.linkedin_url && (
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allProfiles.map((founder) => (
                <Card key={founder.id}>
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(founder.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{founder.full_name}</CardTitle>
                        <CardDescription>{founder.startup_idea.industry}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold">{founder.startup_idea.title}</h4>
                      <p className="text-sm text-muted-foreground">{founder.startup_idea.stage}</p>
                      <p className="text-sm mt-2">{founder.startup_idea.description.substring(0, 100)}...</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Their skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {founder.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                        {founder.skills.length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{founder.skills.length - 3} more</Badge>
                        )}
                      </div>
                    </div>

                    <Button size="sm" className="w-full">
                      Request Connect
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {profile && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>Manage your personal information and startup idea</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm text-muted-foreground">{profile.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                    {profile.phone_number && (
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{profile.phone_number}</p>
                      </div>
                    )}
                  </div>

                  {profile.bio && (
                    <div>
                      <p className="text-sm font-medium">Bio</p>
                      <p className="text-sm text-muted-foreground">{profile.bio}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium mb-2">Your Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {profile.linkedin_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {profile.github_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                          GitHub
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};