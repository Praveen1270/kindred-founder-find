import React, { useState } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const INDUSTRIES = [
  'HealthTech', 'EdTech', 'FinTech', 'E-commerce', 'SaaS', 'AI/ML', 
  'CleanTech', 'FoodTech', 'PropTech', 'Gaming', 'Other'
];

const STAGES = ['Idea', 'MVP', 'Revenue Stage', 'Growth Stage'];

const COMMON_SKILLS = [
  'Frontend Development', 'Backend Development', 'Mobile Development', 'UI/UX Design',
  'Product Management', 'Marketing', 'Sales', 'Business Development', 'Data Science',
  'Machine Learning', 'DevOps', 'Finance', 'Legal', 'HR', 'Operations'
];

interface ProfileSetupProps {
  onComplete: () => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentSkill, setCurrentSkill] = useState('');
  const [currentNeededSkill, setCurrentNeededSkill] = useState('');

  const [profile, setProfile] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phoneNumber: '',
    bio: '',
    linkedinUrl: '',
    githubUrl: '',
    skills: [] as string[],
  });

  const [startupIdea, setStartupIdea] = useState({
    title: '',
    description: '',
    industry: '',
    stage: '',
    skillsNeeded: [] as string[],
  });

  const addSkill = (skill: string, type: 'skills' | 'skillsNeeded') => {
    if (!skill.trim()) return;
    
    if (type === 'skills') {
      if (!profile.skills.includes(skill)) {
        setProfile({ ...profile, skills: [...profile.skills, skill] });
      }
      setCurrentSkill('');
    } else {
      if (!startupIdea.skillsNeeded.includes(skill)) {
        setStartupIdea({ ...startupIdea, skillsNeeded: [...startupIdea.skillsNeeded, skill] });
      }
      setCurrentNeededSkill('');
    }
  };

  const removeSkill = (skill: string, type: 'skills' | 'skillsNeeded') => {
    if (type === 'skills') {
      setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
    } else {
      setStartupIdea({ ...startupIdea, skillsNeeded: startupIdea.skillsNeeded.filter(s => s !== skill) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          full_name: profile.fullName,
          email: profile.email,
          phone_number: profile.phoneNumber || null,
          bio: profile.bio || null,
          linkedin_url: profile.linkedinUrl || null,
          github_url: profile.githubUrl || null,
          skills: profile.skills,
        });

      if (profileError) throw profileError;

      // Create startup idea
      const { error: ideaError } = await supabase
        .from('startup_ideas')
        .insert({
          user_id: user.id,
          title: startupIdea.title,
          description: startupIdea.description,
          industry: startupIdea.industry,
          stage: startupIdea.stage,
          skills_needed: startupIdea.skillsNeeded,
        });

      if (ideaError) throw ideaError;

      toast({
        title: 'Profile created!',
        description: 'Welcome to FounderCollab! We\'ll start finding matches for you.',
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Tell us about yourself and your startup idea to find the best co-founder matches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      required
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+1-123-456-7890"
                    value={profile.phoneNumber}
                    onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about your background and experience..."
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                    <Input
                      id="linkedinUrl"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={profile.linkedinUrl}
                      onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="githubUrl">GitHub URL</Label>
                    <Input
                      id="githubUrl"
                      placeholder="https://github.com/yourusername"
                      value={profile.githubUrl}
                      onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Your Skills *</Label>
                  <div className="flex gap-2 mt-2">
                    <Select value={currentSkill} onValueChange={setCurrentSkill}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a skill" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_SKILLS.map((skill) => (
                          <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      onClick={() => addSkill(currentSkill, 'skills')}
                      disabled={!currentSkill}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => removeSkill(skill, 'skills')}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Startup Idea */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Startup Idea</h3>
                
                <div>
                  <Label htmlFor="title">Idea Title *</Label>
                  <Input
                    id="title"
                    placeholder="AI-powered fitness app"
                    value={startupIdea.title}
                    onChange={(e) => setStartupIdea({ ...startupIdea, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your startup idea in detail..."
                    value={startupIdea.description}
                    onChange={(e) => setStartupIdea({ ...startupIdea, description: e.target.value })}
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry *</Label>
                    <Select value={startupIdea.industry} onValueChange={(value) => setStartupIdea({ ...startupIdea, industry: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="stage">Stage *</Label>
                    <Select value={startupIdea.stage} onValueChange={(value) => setStartupIdea({ ...startupIdea, stage: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map((stage) => (
                          <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Skills You Need *</Label>
                  <div className="flex gap-2 mt-2">
                    <Select value={currentNeededSkill} onValueChange={setCurrentNeededSkill}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a skill you need" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_SKILLS.map((skill) => (
                          <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      onClick={() => addSkill(currentNeededSkill, 'skillsNeeded')}
                      disabled={!currentNeededSkill}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {startupIdea.skillsNeeded.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => removeSkill(skill, 'skillsNeeded')}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Profile...' : 'Complete Setup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};