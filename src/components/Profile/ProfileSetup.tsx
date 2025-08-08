import React, { useState } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, AlertCircle, Database, Search, CheckCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const INDUSTRIES = [
  'HealthTech', 'EdTech', 'FinTech', 'E-commerce', 'SaaS', 'AI/ML', 
  'CleanTech', 'FoodTech', 'PropTech', 'Gaming', 'Other'
];

const STAGES = ['Idea', 'MVP', 'Revenue Stage', 'Prototype', 'Launched'];

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
  const [databaseError, setDatabaseError] = useState(false);
  const [profileCreated, setProfileCreated] = useState(false);

  const [profile, setProfile] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phoneNumber: '',
    bio: '',
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
    setDatabaseError(false);

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
          skills: profile.skills,
        });

      if (profileError) {
        // Check if it's a table doesn't exist error
        if (profileError.message.includes('relation "profiles" does not exist')) {
          setDatabaseError(true);
          toast({
            title: 'Database Setup Required',
            description: 'Please set up the database tables first. Check the deployment guide for instructions.',
            variant: 'destructive',
          });
          return;
        }
        throw profileError;
      }

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

      if (ideaError) {
        if (ideaError.message.includes('relation "startup_ideas" does not exist')) {
          setDatabaseError(true);
          toast({
            title: 'Database Setup Required',
            description: 'Please set up the database tables first. Check the deployment guide for instructions.',
            variant: 'destructive',
          });
          return;
        }
        throw ideaError;
      }

      toast({
        title: 'Profile created successfully!',
        description: 'Your profile has been created. You can now find matches.',
      });

      setProfileCreated(true);
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

  const handleFindMatches = () => {
    onComplete();
  };

  if (databaseError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-8 pt-12">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <Database className="h-8 w-8 text-red-500" />
                <CardTitle className="text-3xl font-bold text-gray-900">Database Setup Required</CardTitle>
              </div>
              <CardDescription className="text-lg text-gray-600">
                The database tables need to be created before you can create your profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-12">
              <Alert className="mb-8 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700">
                  To set up the database, you need to run the SQL migration in your Supabase project.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Steps to set up:</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to the SQL Editor</li>
                  <li>Copy the contents of <code className="bg-gray-100 px-2 py-1 rounded text-sm">supabase/migrations/001_initial_schema.sql</code></li>
                  <li>Paste and run the SQL commands</li>
                  <li>Refresh this page and try again</li>
                </ol>
              </div>

              <div className="flex gap-4 mt-8">
                <Button 
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('https://supabase.com/docs', '_blank')}
                  className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-medium"
                >
                  Supabase Docs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (profileCreated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-8 pt-12">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <CardTitle className="text-3xl font-bold text-gray-900">Profile Created Successfully!</CardTitle>
              </div>
              <CardDescription className="text-lg text-gray-600">
                Your profile has been created. You can now find potential co-founders.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-12">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6 mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="font-semibold text-green-800 text-lg">Profile Setup Complete</span>
                </div>
                <p className="text-green-700 leading-relaxed">
                  Your skills, startup idea, and preferences have been saved. You're now ready to find matches!
                </p>
              </div>
              
              <div className="space-y-4 mb-8">
                <h4 className="font-semibold text-gray-900 text-lg">What's next?</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Browse potential co-founders</li>
                  <li>Get matched based on your skills and startup idea</li>
                  <li>Connect with founders who complement your skills</li>
                  <li>Start building your startup together</li>
                </ul>
              </div>

              <Button 
                onClick={handleFindMatches} 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Search className="h-5 w-5 mr-3" />
                Find Matches
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-8 pt-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">Complete Your Profile</CardTitle>
            </div>
            <CardDescription className="text-lg text-gray-600">
              Tell us about yourself and your startup idea to find the best co-founder matches.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-12">
            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Personal Information */}
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h3>
                  <p className="text-gray-600">Tell us about yourself</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 mb-3 block">
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-3 block">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 mb-3 block">
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+1-123-456-7890"
                    value={profile.phoneNumber}
                    onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                    className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="bio" className="text-sm font-medium text-gray-700 mb-3 block">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about your background and experience..."
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="min-h-[120px] rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Your Skills *</Label>
                  <div className="flex gap-3 mb-4">
                    <Select value={currentSkill} onValueChange={setCurrentSkill}>
                      <SelectTrigger className="flex-1 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
                      className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="px-4 py-2 rounded-full text-sm">
                        {skill}
                        <X
                          className="h-4 w-4 ml-2 cursor-pointer hover:text-red-500"
                          onClick={() => removeSkill(skill, 'skills')}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Startup Idea */}
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Startup Idea</h3>
                  <p className="text-gray-600">Share your vision</p>
                </div>
                
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-3 block">
                    Idea Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="AI-powered fitness app"
                    value={startupIdea.title}
                    onChange={(e) => setStartupIdea({ ...startupIdea, title: e.target.value })}
                    className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-3 block">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your startup idea in detail..."
                    value={startupIdea.description}
                    onChange={(e) => setStartupIdea({ ...startupIdea, description: e.target.value })}
                    className="min-h-[120px] rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="industry" className="text-sm font-medium text-gray-700 mb-3 block">
                      Industry *
                    </Label>
                    <Select value={startupIdea.industry} onValueChange={(value) => setStartupIdea({ ...startupIdea, industry: value })}>
                      <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
                    <Label htmlFor="stage" className="text-sm font-medium text-gray-700 mb-3 block">
                      Stage *
                    </Label>
                    <Select value={startupIdea.stage} onValueChange={(value) => setStartupIdea({ ...startupIdea, stage: value })}>
                      <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Skills You Need *</Label>
                  <div className="flex gap-3 mb-4">
                    <Select value={currentNeededSkill} onValueChange={setCurrentNeededSkill}>
                      <SelectTrigger className="flex-1 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
                      className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {startupIdea.skillsNeeded.map((skill) => (
                      <Badge key={skill} variant="outline" className="px-4 py-2 rounded-full text-sm">
                        {skill}
                        <X
                          className="h-4 w-4 ml-2 cursor-pointer hover:text-red-500"
                          onClick={() => removeSkill(skill, 'skillsNeeded')}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={loading}
              >
                {loading ? 'Creating Profile...' : 'Create Profile & Find Matches'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};