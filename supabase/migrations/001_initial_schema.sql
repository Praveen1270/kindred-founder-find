-- Create profiles table for founder information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  linkedin_url TEXT,
  github_url TEXT,
  bio TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create startup_ideas table
CREATE TABLE public.startup_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  industry TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('Idea', 'MVP', 'Revenue Stage', 'Prototype', 'Launched')),
  skills_needed TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  founder1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  founder2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  compatibility_score INTEGER NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(founder1_id, founder2_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'match',
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_startup_ideas_user_id ON startup_ideas(user_id);
CREATE INDEX idx_startup_ideas_active ON startup_ideas(is_active);
CREATE INDEX idx_matches_founder1 ON matches(founder1_id);
CREATE INDEX idx_matches_founder2 ON matches(founder2_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON profiles FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for startup_ideas
CREATE POLICY "Users can view all startup ideas" ON startup_ideas FOR SELECT USING (true);
CREATE POLICY "Users can insert their own startup idea" ON startup_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own startup idea" ON startup_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own startup idea" ON startup_ideas FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for matches
CREATE POLICY "Users can view their matches" ON matches FOR SELECT USING (
  auth.uid() IN (founder1_id, founder2_id)
);
CREATE POLICY "Users can insert matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their matches" ON matches FOR UPDATE USING (
  auth.uid() IN (founder1_id, founder2_id)
);
CREATE POLICY "Users can delete their matches" ON matches FOR DELETE USING (
  auth.uid() IN (founder1_id, founder2_id)
);

-- Create RLS policies for messages
CREATE POLICY "Users can view their messages" ON messages FOR SELECT USING (
  auth.uid() IN (sender_id, receiver_id)
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their sent messages" ON messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Users can delete their sent messages" ON messages FOR DELETE USING (auth.uid() = sender_id);

-- Create RLS policies for notifications
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Create functions for matching algorithm
CREATE OR REPLACE FUNCTION calculate_compatibility_score(
  skills1 TEXT[],
  skills_needed1 TEXT[],
  skills2 TEXT[],
  skills_needed2 TEXT[],
  industry1 TEXT,
  industry2 TEXT,
  stage1 TEXT,
  stage2 TEXT
) RETURNS INTEGER AS $$
DECLARE
  skill_match_score INTEGER := 0;
  industry_match_score INTEGER := 0;
  stage_match_score INTEGER := 0;
  total_score INTEGER := 0;
BEGIN
  -- Calculate skill complementarity (40% weight)
  -- Check if founder1's skills match founder2's needs
  IF EXISTS (SELECT 1 FROM unnest(skills1) skill WHERE skill = ANY(skills_needed2)) THEN
    skill_match_score := skill_match_score + 20;
  END IF;
  
  -- Check if founder2's skills match founder1's needs
  IF EXISTS (SELECT 1 FROM unnest(skills2) skill WHERE skill = ANY(skills_needed1)) THEN
    skill_match_score := skill_match_score + 20;
  END IF;
  
  -- Calculate industry similarity (30% weight)
  IF industry1 = industry2 THEN
    industry_match_score := 30;
  ELSIF industry1 LIKE '%Tech%' AND industry2 LIKE '%Tech%' THEN
    industry_match_score := 20;
  ELSE
    industry_match_score := 10;
  END IF;
  
  -- Calculate stage alignment (30% weight)
  IF stage1 = stage2 THEN
    stage_match_score := 30;
  ELSIF (stage1 = 'Idea' AND stage2 = 'MVP') OR (stage1 = 'MVP' AND stage2 = 'Idea') THEN
    stage_match_score := 25;
  ELSIF (stage1 = 'MVP' AND stage2 = 'Revenue Stage') OR (stage1 = 'Revenue Stage' AND stage2 = 'MVP') THEN
    stage_match_score := 20;
  ELSE
    stage_match_score := 15;
  END IF;
  
  total_score := skill_match_score + industry_match_score + stage_match_score;
  
  -- Ensure score is between 0 and 100
  RETURN GREATEST(0, LEAST(100, total_score));
END;
$$ LANGUAGE plpgsql;

-- Create function to generate matches
CREATE OR REPLACE FUNCTION generate_matches() RETURNS void AS $$
DECLARE
  founder1 RECORD;
  founder2 RECORD;
  idea1 RECORD;
  idea2 RECORD;
  compatibility_score INTEGER;
BEGIN
  -- Clear existing matches
  DELETE FROM matches;
  
  -- Generate new matches
  FOR founder1 IN SELECT * FROM profiles LOOP
    FOR founder2 IN SELECT * FROM profiles WHERE id > founder1.id LOOP
      -- Get startup ideas for both founders
      SELECT * INTO idea1 FROM startup_ideas WHERE user_id = founder1.user_id AND is_active = true LIMIT 1;
      SELECT * INTO idea2 FROM startup_ideas WHERE user_id = founder2.user_id AND is_active = true LIMIT 1;
      
      -- Only create match if both have active startup ideas
      IF idea1 IS NOT NULL AND idea2 IS NOT NULL THEN
        compatibility_score := calculate_compatibility_score(
          founder1.skills,
          idea1.skills_needed,
          founder2.skills,
          idea2.skills_needed,
          idea1.industry,
          idea2.industry,
          idea1.stage,
          idea2.stage
        );
        
        -- Only create match if compatibility score is above threshold
        IF compatibility_score >= 30 THEN
          INSERT INTO matches (founder1_id, founder2_id, compatibility_score)
          VALUES (founder1.user_id, founder2.user_id, compatibility_score);
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to send notifications
CREATE OR REPLACE FUNCTION send_match_notification() RETURNS TRIGGER AS $$
BEGIN
  -- Send notification to founder1
  INSERT INTO notifications (user_id, title, message, type, related_id)
  SELECT p1.user_id, 
         'New Match Found!', 
         'You have a new match with ' || p2.full_name || ' (' || NEW.compatibility_score || '% compatibility)',
         'match',
         NEW.id
  FROM profiles p1, profiles p2
  WHERE p1.user_id = NEW.founder1_id AND p2.user_id = NEW.founder2_id;
  
  -- Send notification to founder2
  INSERT INTO notifications (user_id, title, message, type, related_id)
  SELECT p2.user_id, 
         'New Match Found!', 
         'You have a new match with ' || p1.full_name || ' (' || NEW.compatibility_score || '% compatibility)',
         'match',
         NEW.id
  FROM profiles p1, profiles p2
  WHERE p1.user_id = NEW.founder1_id AND p2.user_id = NEW.founder2_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for match notifications
CREATE TRIGGER match_notification_trigger
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION send_match_notification(); 