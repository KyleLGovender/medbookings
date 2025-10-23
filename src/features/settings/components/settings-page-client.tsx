'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { AlertTriangle, CheckCircle, Mail, Shield, User } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

import { useSettings } from '../hooks/use-settings';
import AccountDeletionSection from './account-deletion-section';
import AccountSettingsSection from './account-settings-section';
import CommunicationPreferencesSection from './communication-preferences-section';

export default function SettingsPageClient() {
  const { data: settings, isLoading, error, refetch } = useSettings();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Handle query parameters for verification messages
  useEffect(() => {
    const success = searchParams?.get('success');
    const errorParam = searchParams?.get('error');

    if (success === 'email-verified') {
      // Refetch settings to get updated emailVerified status
      refetch();

      toast({
        title: 'Email verified',
        description: 'Your email address has been successfully verified.',
        duration: 5000,
      });

      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
    } else if (errorParam) {
      let errorMessage = 'An error occurred during email verification.';

      switch (errorParam) {
        case 'invalid-token':
          errorMessage = 'Invalid verification token.';
          break;
        case 'token-expired':
          errorMessage = 'Verification token has expired. Please request a new one.';
          break;
        case 'user-not-found':
          errorMessage = 'User account not found.';
          break;
        case 'verification-failed':
          errorMessage = 'Email verification failed. Please try again.';
          break;
        default:
          break;
      }

      toast({
        title: 'Verification failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });

      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [searchParams, toast, refetch]);

  // Refetch settings when page becomes visible (user returns from email verification)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch]);

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to load settings. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Settings data not available.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Notice for providers about the new provider profile page */}
      {settings.isProvider && (
        <Alert className="mb-6">
          <AlertDescription>
            Looking for your provider settings? Visit your{' '}
            <a href="/provider-profile" className="font-medium underline">
              Provider Profile
            </a>{' '}
            page to manage your professional information, services, and business settings.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountSettingsSection user={settings.user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Preferences</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications and reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommunicationPreferencesSection preferences={settings.communicationPreferences} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your account security and deletion options</CardDescription>
            </CardHeader>
            <CardContent>
              <AccountDeletionSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
