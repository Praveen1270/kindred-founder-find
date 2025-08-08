import React from 'react';
import { AuthProvider, useAuth } from '@/components/Auth/AuthProvider';
import { AuthForm } from '@/components/Auth/AuthForm';
import { useProfile } from '@/hooks/useProfile';
import { ProfileSetup } from '@/components/Profile/ProfileSetup';
import { useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

const SignContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasProfile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated and has profile
  if (!authLoading && user && !profileLoading && hasProfile) {
    navigate('/dashboard');
    return null;
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show profile setup if user doesn't have a profile
  if (!profileLoading && user && !hasProfile) {
    return <ProfileSetup onComplete={() => navigate('/dashboard')} />;
  }

  // Show loading while checking profile
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  // Show auth form
  return <AuthForm />;
};

const Sign: React.FC = () => {
  return (
    <AuthProvider>
      <SignContent />
      <Toaster />
    </AuthProvider>
  );
};

export default Sign;
