import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LogOut, Mail, Phone, ExternalLink, Users, Lightbulb, Search, MessageCircle, Bell, Send, AlertCircle, Database, User, Briefcase, Edit, X, Menu, ChevronDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { MatchingService, MatchResult } from '@/lib/matching-service';
import { NotificationService, Notification } from '@/lib/notification-service';
import { MessagingService, Conversation, Message } from '@/lib/messaging-service';
import { useIsMobile } from '@/hooks/use-mobile';

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

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [startupIdea, setStartupIdea] = useState<StartupIdea | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [allProfiles, setAllProfiles] = useState<(Profile & { startup_idea: StartupIdea })[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [databaseError, setDatabaseError] = useState(false);
  const [findingMatches, setFindingMatches] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    bio: '',
    skills: [] as string[],
    currentSkill: '',
    title: '',
    description: '',
    industry: '',
    stage: '',
    skillsNeeded: [] as string[],
    currentNeededSkill: '',
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setDatabaseError(false);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        if (profileError.message.includes('relation "profiles" does not exist')) {
          setDatabaseError(true);
          return;
        }
        throw profileError;
      }
      setProfile(profileData);

      // Load startup idea
      const { data: ideaData, error: ideaError } = await supabase
        .from('startup_ideas')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (ideaError && !ideaError.message.includes('relation "startup_ideas" does not exist')) {
        throw ideaError;
      }
      setStartupIdea(ideaData);

      // Try to load matches and other data
      try {
        await loadMatches();
        await loadAllProfiles();
        await loadNotifications();
        await loadConversations();
      } catch (error) {
        console.log('Some features not available - database tables may not be set up');
      }
    } catch (error: any) {
      console.error('Error loading user data:', error);
      setDatabaseError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    if (!user || !profile) return;

    try {
      const matchesData = await MatchingService.getMatchesForUser(profile.id);
      setMatches(matchesData);
    } catch (error: any) {
      console.error('Error loading matches:', error);
    }
  };

  const loadAllProfiles = async () => {
    if (!user) return;

    try {
      const profilesData = await MatchingService.getAllProfiles();
      setAllProfiles(profilesData.filter(p => p.user_id !== user.id));
    } catch (error: any) {
      console.error('Error loading profiles:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const notificationsData = await NotificationService.getNotifications(user.id);
      setNotifications(notificationsData);
      setUnreadNotifications(notificationsData.filter(n => !n.is_read).length);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadConversations = async () => {
    if (!user || !profile) return;

    try {
      const conversationsData = await MessagingService.getConversations(profile.id);
      setConversations(conversationsData);
      setUnreadMessages(conversationsData.reduce((sum, conv) => sum + conv.unread_count, 0));
    } catch (error: any) {
      console.error('Error loading conversations:', error);
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

  const handleFindMatches = async () => {
    setFindingMatches(true);
    try {
      await MatchingService.generateMatches();
      await loadMatches();
      await loadAllProfiles();
      toast({
        title: 'Matches Found!',
        description: `Found ${matches.length} potential co-founders for you.`,
      });
    } catch (error: any) {
      toast({
        title: 'Database Setup Required',
        description: 'Please set up the database tables to use this feature.',
        variant: 'destructive',
      });
    } finally {
      setFindingMatches(false);
    }
  };

  const handleMarkNotificationsAsRead = async () => {
    if (!user) return;

    try {
      await NotificationService.markAllAsRead(user.id);
      await loadNotifications();
    } catch (error: any) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleOpenConversation = async (conversation: Conversation) => {
    if (!user || !profile) return;

    setSelectedConversation(conversation);
    
    try {
      const messagesData = await MessagingService.getMessages(profile.id, conversation.other_profile.id);
      setMessages(messagesData);
      
      // Mark messages as read
      await MessagingService.markMessagesAsRead(profile.id, conversation.other_profile.id);
      await loadConversations();
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !profile || !selectedConversation || !newMessage.trim()) return;

    try {
      await MessagingService.sendMessage(profile.id, selectedConversation.other_profile.id, newMessage);
      setNewMessage('');
      
      // Reload messages
      const messagesData = await MessagingService.getMessages(profile.id, selectedConversation.other_profile.id);
      setMessages(messagesData);
      await loadConversations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive',
      });
    }
  };

  const handleEditProfile = () => {
    if (profile && startupIdea) {
      setEditForm({
        fullName: profile.full_name,
        email: profile.email,
        phoneNumber: profile.phone_number || '',
        bio: profile.bio || '',
        skills: profile.skills,
        currentSkill: '',
        title: startupIdea.title,
        description: startupIdea.description,
        industry: startupIdea.industry,
        stage: startupIdea.stage,
        skillsNeeded: startupIdea.skills_needed,
        currentNeededSkill: '',
      });
      setShowEditProfile(true);
    }
  };

  const addSkill = (skill: string, type: 'skills' | 'skillsNeeded') => {
    if (!skill.trim()) return;
    
    if (type === 'skills') {
      if (!editForm.skills.includes(skill)) {
        setEditForm({ ...editForm, skills: [...editForm.skills, skill], currentSkill: '' });
      }
    } else {
      if (!editForm.skillsNeeded.includes(skill)) {
        setEditForm({ ...editForm, skillsNeeded: [...editForm.skillsNeeded, skill], currentNeededSkill: '' });
      }
    }
  };

  const removeSkill = (skill: string, type: 'skills' | 'skillsNeeded') => {
    if (type === 'skills') {
      setEditForm({ ...editForm, skills: editForm.skills.filter(s => s !== skill) });
    } else {
      setEditForm({ ...editForm, skillsNeeded: editForm.skillsNeeded.filter(s => s !== skill) });
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile || !startupIdea) return;

    setEditingProfile(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.fullName,
          phone_number: editForm.phoneNumber || null,
          bio: editForm.bio || null,
          skills: editForm.skills,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update startup idea
      const { error: ideaError } = await supabase
        .from('startup_ideas')
        .update({
          title: editForm.title,
          description: editForm.description,
          industry: editForm.industry,
          stage: editForm.stage,
          skills_needed: editForm.skillsNeeded,
        })
        .eq('user_id', user.id);

      if (ideaError) throw ideaError;

      toast({
        title: 'Profile Updated!',
        description: 'Your profile has been updated successfully.',
      });

      setShowEditProfile(false);
      await loadUserData(); // Reload data
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setEditingProfile(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  if (databaseError) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">FounderCollab</h1>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 mb-4">
                <Database className="h-6 w-6 text-destructive" />
                <CardTitle>Database Setup Required</CardTitle>
              </div>
              <CardDescription>
                The database tables need to be created to use all features of the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  To set up the database, you need to run the SQL migration in your Supabase project.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Steps to set up:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to the SQL Editor</li>
                  <li>Copy the contents of <code className="bg-muted px-1 rounded">supabase/migrations/001_initial_schema.sql</code></li>
                  <li>Paste and run the SQL commands</li>
                  <li>Refresh this page and try again</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => window.open('https://supabase.com/docs', '_blank')}>
                  Supabase Docs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-semibold text-gray-900">FounderCollab</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {profile?.full_name}!</span>
              
              {/* Notifications */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="relative border-gray-200 rounded-xl">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                    {unreadNotifications > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500">
                        {unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md border-0 shadow-2xl rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900">Notifications</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No notifications</p>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className={`p-4 rounded-2xl ${!notification.is_read ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                          <h4 className="font-semibold text-gray-900 text-sm">{notification.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  {unreadNotifications > 0 && (
                    <Button 
                      onClick={handleMarkNotificationsAsRead} 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium"
                    >
                      Mark All as Read
                    </Button>
                  )}
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="relative border-gray-200 rounded-xl">
                    <Bell className="h-4 w-4" />
                    {unreadNotifications > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500">
                        {unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md border-0 shadow-2xl rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900">Notifications</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No notifications</p>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className={`p-4 rounded-2xl ${!notification.is_read ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                          <h4 className="font-semibold text-gray-900 text-sm">{notification.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  {unreadNotifications > 0 && (
                    <Button 
                      onClick={handleMarkNotificationsAsRead} 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium"
                    >
                      Mark All as Read
                    </Button>
                  )}
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-gray-100 py-4 space-y-3">
              <div className="text-sm text-gray-600">Welcome, {profile?.full_name}!</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className={`grid w-full ${isMobile === true ? 'grid-cols-2 gap-2' : 'grid-cols-5'} bg-gray-100 p-1 rounded-2xl mb-6 sm:mb-8`}>
            <TabsTrigger 
              value="dashboard" 
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-xs sm:text-sm"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="matches"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-xs sm:text-sm"
            >
              Matches ({matches.length})
            </TabsTrigger>
            <TabsTrigger 
              value="search"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-xs sm:text-sm"
            >
              Search
            </TabsTrigger>
            <TabsTrigger 
              value="messages"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-xs sm:text-sm"
            >
              Messages {unreadMessages > 0 && `(${unreadMessages})`}
            </TabsTrigger>
            <TabsTrigger 
              value="profile"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-xs sm:text-sm"
            >
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h2>
              <Button 
                onClick={handleFindMatches} 
                disabled={findingMatches}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Search className="h-4 w-4 mr-2" />
                {findingMatches ? 'Finding Matches...' : 'Find Matches'}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 sm:p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Total Matches</h3>
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{matches.length}</div>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Potential co-founders
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl p-6 sm:p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Your Idea Stage</h3>
                  <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{startupIdea?.stage || 'Not set'}</div>
                <p className="text-gray-600 text-xs sm:text-sm">
                  {startupIdea?.industry || 'No industry selected'}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-6 sm:p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Available Founders</h3>
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{allProfiles.length}</div>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Actively looking for co-founders
                </p>
              </div>
            </div>

            {startupIdea && (
              <div className="bg-white rounded-3xl p-8 border-0 shadow-lg">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Lightbulb className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Your Startup Idea</h3>
                    <p className="text-gray-600">{startupIdea.industry} • {startupIdea.stage}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{startupIdea.title}</h4>
                    <p className="text-gray-600 leading-relaxed">{startupIdea.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Skills you need:</p>
                    <div className="flex flex-wrap gap-3">
                      {startupIdea.skills_needed.map((skill) => (
                        <Badge key={skill} variant="outline" className="px-4 py-2 rounded-full text-sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {matches.length === 0 && (
              <div className="bg-white rounded-3xl p-12 border-0 shadow-lg text-center">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No matches yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Click "Find Matches" to discover potential co-founders
                </p>
                <Button 
                  onClick={handleFindMatches} 
                  disabled={findingMatches}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {findingMatches ? 'Finding Matches...' : 'Find Matches'}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="matches" className="space-y-8">
            {matches.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border-0 shadow-lg text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No matches yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Generate matches to find potential co-founders
                </p>
                <Button 
                  onClick={handleFindMatches} 
                  disabled={findingMatches}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {findingMatches ? 'Finding Matches...' : 'Find Matches'}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {matches.map((match) => (
                  <div key={match.id} className="bg-white rounded-3xl p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center space-x-4 mb-6">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {getInitials(match.matched_profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{match.matched_profile.full_name}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                            {match.compatibility_score}% match
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg mb-2">{match.matched_idea.title}</h4>
                        <p className="text-gray-600 text-sm mb-3">{match.matched_idea.industry} • {match.matched_idea.stage}</p>
                        <p className="text-gray-700 leading-relaxed">{match.matched_idea.description.substring(0, 120)}...</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">Their skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {match.matched_profile.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="secondary" className="px-3 py-1 rounded-full text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {match.matched_profile.skills.length > 3 && (
                            <Badge variant="secondary" className="px-3 py-1 rounded-full text-xs">
                              +{match.matched_profile.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button 
                        size="sm" 
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium"
                        onClick={() => {
                          const conversation = conversations.find(c => c.other_profile.id === match.matched_profile.id);
                          if (conversation) {
                            handleOpenConversation(conversation);
                          }
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-8">
            {allProfiles.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border-0 shadow-lg text-center">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No founders found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  More founders will appear here as they join the platform
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allProfiles.map((founder) => (
                  <div key={founder.id} className="bg-white rounded-3xl p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center space-x-4 mb-6">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {getInitials(founder.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{founder.full_name}</h3>
                        <p className="text-gray-600 text-sm">{founder.startup_idea.industry}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg mb-2">{founder.startup_idea.title}</h4>
                        <p className="text-gray-600 text-sm mb-3">{founder.startup_idea.stage}</p>
                        <p className="text-gray-700 leading-relaxed">{founder.startup_idea.description.substring(0, 100)}...</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">Their skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {founder.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="secondary" className="px-3 py-1 rounded-full text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {founder.skills.length > 3 && (
                            <Badge variant="secondary" className="px-3 py-1 rounded-full text-xs">
                              +{founder.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button 
                        size="sm" 
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium"
                      >
                        Request Connect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Conversations List */}
              <div className="lg:col-span-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Conversations</h3>
                <div className="space-y-4">
                  {conversations.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 border-0 shadow-lg text-center">
                      <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No conversations yet</p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <div 
                        key={conversation.other_profile.id}
                        className={`bg-white rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border-0 ${
                          selectedConversation?.other_profile.id === conversation.other_profile.id ? 'shadow-lg ring-2 ring-blue-500' : 'shadow-sm'
                        }`}
                        onClick={() => handleOpenConversation(conversation)}
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {getInitials(conversation.other_profile.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {conversation.other_profile.full_name}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.messages[conversation.messages.length - 1]?.content || 'No messages yet'}
                            </p>
                          </div>
                          {conversation.unread_count > 0 && (
                            <Badge className="h-6 w-6 p-0 text-xs bg-red-500">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="lg:col-span-2">
                {selectedConversation ? (
                  <div className="bg-white rounded-3xl border-0 shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                      <h3 className="text-xl font-bold text-gray-900">{selectedConversation.other_profile.full_name}</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="h-96 overflow-y-auto space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs p-4 rounded-2xl ${
                                message.sender_id === profile?.id
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-2 ${message.sender_id === profile?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                {formatDate(message.created_at)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-3">
                        <Textarea
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="flex-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                        />
                        <Button 
                          onClick={handleSendMessage} 
                          disabled={!newMessage.trim()}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-4"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-12 border-0 shadow-lg text-center">
                    <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                    <p className="text-gray-600">Select a conversation to start messaging</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-8">
            {profile && (
              <div className="bg-white rounded-3xl border-0 shadow-lg overflow-hidden">
                <div className="p-8 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Your Profile</h3>
                      <p className="text-gray-600">Manage your personal information and startup idea</p>
                    </div>
                    <Button 
                      onClick={handleEditProfile} 
                      variant="outline" 
                      size="sm"
                      className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Name</p>
                      <p className="text-lg text-gray-900">{profile.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Email</p>
                      <p className="text-lg text-gray-900">{profile.email}</p>
                    </div>
                    {profile.phone_number && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Phone</p>
                        <p className="text-lg text-gray-900">{profile.phone_number}</p>
                      </div>
                    )}
                  </div>

                  {profile.bio && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Bio</p>
                      <p className="text-lg text-gray-900 leading-relaxed">{profile.bio}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-4">Your Skills</p>
                    <div className="flex flex-wrap gap-3">
                      {profile.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="px-4 py-2 rounded-full text-sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {startupIdea && (
                    <div className="border-t border-gray-100 pt-8">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Lightbulb className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">Your Startup Idea</h4>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Title</p>
                          <p className="text-lg text-gray-900">{startupIdea.title}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
                          <p className="text-lg text-gray-900 leading-relaxed">{startupIdea.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Industry</p>
                            <p className="text-lg text-gray-900">{startupIdea.industry}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Stage</p>
                            <p className="text-lg text-gray-900">{startupIdea.stage}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-4">Skills You Need</p>
                          <div className="flex flex-wrap gap-3">
                            {startupIdea.skills_needed.map((skill) => (
                              <Badge key={skill} variant="outline" className="px-4 py-2 rounded-full text-sm">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl rounded-3xl">
          <DialogHeader className="text-center pb-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">Edit Profile</DialogTitle>
            </div>
            <p className="text-gray-600">Update your profile and startup idea to find better matches</p>
          </DialogHeader>
          <div className="space-y-8">
            {/* Personal Information */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-fullName" className="text-sm font-medium text-gray-700 mb-2 block">Full Name *</Label>
                  <Input
                    id="edit-fullName"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700 mb-2 block">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    className="h-12 rounded-xl border-gray-200 bg-gray-50"
                    disabled
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-phoneNumber" className="text-sm font-medium text-gray-700 mb-2 block">Phone Number</Label>
                <Input
                  id="edit-phoneNumber"
                  type="tel"
                  placeholder="+1-123-456-7890"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="edit-bio" className="text-sm font-medium text-gray-700 mb-2 block">Bio</Label>
                <Textarea
                  id="edit-bio"
                  placeholder="Tell us about your background and experience..."
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Your Skills *</Label>
                <div className="flex gap-2 mt-2">
                  <Select value={editForm.currentSkill} onValueChange={(value) => setEditForm({ ...editForm, currentSkill: value })}>
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
                    onClick={() => addSkill(editForm.currentSkill, 'skills')}
                    disabled={!editForm.currentSkill}
                    className="h-12 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {editForm.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="rounded-xl px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">
                      {skill}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer hover:text-blue-600"
                        onClick={() => removeSkill(skill, 'skills')}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Startup Idea */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Startup Idea</h3>
              </div>
              
              <div>
                <Label htmlFor="edit-title" className="text-sm font-medium text-gray-700 mb-2 block">Idea Title *</Label>
                <Input
                  id="edit-title"
                  placeholder="AI-powered fitness app"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-description" className="text-sm font-medium text-gray-700 mb-2 block">Description *</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Describe your startup idea in detail..."
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 min-h-[120px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-industry" className="text-sm font-medium text-gray-700 mb-2 block">Industry *</Label>
                  <Select value={editForm.industry} onValueChange={(value) => setEditForm({ ...editForm, industry: value })}>
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
                  <Label htmlFor="edit-stage" className="text-sm font-medium text-gray-700 mb-2 block">Stage *</Label>
                  <Select value={editForm.stage} onValueChange={(value) => setEditForm({ ...editForm, stage: value })}>
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
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Skills You Need *</Label>
                <div className="flex gap-2 mt-2">
                  <Select value={editForm.currentNeededSkill} onValueChange={(value) => setEditForm({ ...editForm, currentNeededSkill: value })}>
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
                    onClick={() => addSkill(editForm.currentNeededSkill, 'skillsNeeded')}
                    disabled={!editForm.currentNeededSkill}
                    className="h-12 px-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-medium"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {editForm.skillsNeeded.map((skill) => (
                    <Badge key={skill} variant="outline" className="rounded-xl px-3 py-1 bg-green-100 text-green-800 border-green-200">
                      {skill}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer hover:text-green-600"
                        onClick={() => removeSkill(skill, 'skillsNeeded')}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button 
                onClick={handleSaveProfile} 
                disabled={editingProfile} 
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {editingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEditProfile(false)}
                className="h-12 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};