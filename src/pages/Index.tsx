import React from 'react';
import { AuthProvider, useAuth } from '@/components/Auth/AuthProvider';
import { AuthForm } from '@/components/Auth/AuthForm';
import { ProfileSetup } from '@/components/Profile/ProfileSetup';
import { Dashboard } from '@/components/Dashboard/Dashboard';
import { useProfile } from '@/hooks/useProfile';
import { Toaster } from '@/components/ui/toaster';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasProfile, loading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  if (!hasProfile) {
    return <ProfileSetup onComplete={() => window.location.reload()} />;
  }

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
