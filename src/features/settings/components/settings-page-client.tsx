'use client';

import { AlertTriangle, Briefcase, Mail, Shield, User } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useSettings } from '../hooks/use-settings';
import AccountDeletionSection from './account-deletion-section';
import AccountSettingsSection from './account-settings-section';
import CommunicationPreferencesSection from './communication-preferences-section';
import ProviderBusinessSettingsSection from './provider-business-settings-section';

export default function SettingsPageClient() {
  const { data: settings, isLoading, error } = useSettings();

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

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          {settings.isProvider && (
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
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

        {settings.isProvider && (
          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Settings</CardTitle>
                <CardDescription>
                  Manage your provider profile and business information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProviderBusinessSettingsSection provider={settings.provider!} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

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
