import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/components/Auth/AuthProvider';
import { AuthForm } from '@/components/Auth/AuthForm';
import { ProfileSetup } from '@/components/Profile/ProfileSetup';
import { Dashboard } from '@/components/Dashboard/Dashboard';
import { useProfile } from '@/hooks/useProfile';
import { Toaster } from '@/components/ui/toaster';
import { LandingPage } from '@/components/Landing/LandingPage';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasProfile, loading: profileLoading } = useProfile();
  const [showAuth, setShowAuth] = useState(false);

  // Show landing page if not authenticated and not showing auth
  if (!authLoading && !user && !showAuth) {
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  // Show auth form if user clicked get started or not authenticated
  if (!authLoading && !user && showAuth) {
    return <AuthForm />;
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
  if (!profileLoading && !hasProfile) {
    return <ProfileSetup onComplete={() => window.location.reload()} />;
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

  // Show dashboard if user has profile
  return <Dashboard />;
};

const Index: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
};

export default Index;
