'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  Award,
  Briefcase,
  Calendar,
  Edit,
  FileText,
  Globe,
  Languages as LanguagesIcon,
  MapPin,
  Phone,
  PlayCircle,
  Star,
  User,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DisconnectConfirmationDialog } from '@/features/calendar/components/sync/disconnect-confirmation-dialog';
import { ProviderCalendarSyncDashboard } from '@/features/calendar/components/sync/provider-calendar-sync-dashboard';
import { useCalendarSync } from '@/features/calendar/hooks/use-calendar-sync';
import { useCurrentUserProvider } from '@/features/providers/hooks/use-current-user-provider';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/utils/api';

// cross-feature-import-safe: Dashboard/profile page importing self-contained calendar UI components
// Data ownership: Provider owns CalendarIntegration (providerId FK)
// Pattern: Acceptable per CLAUDE.md Section 3 - Dashboard aggregation + presentation layer

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ProviderAvailabilitySection } from './provider-availability-section';
import { ProviderBusinessSettingsView } from './provider-business-settings-view';
import { ProviderRequirementsSection } from './provider-requirements-section';
import { ProviderServicesSection } from './provider-services-section';

export function ProviderProfileClient() {
  const { data: provider, isLoading, error } = useCurrentUserProvider();
  const router = useRouter();
  const { toast } = useToast();
  const utils = api.useUtils();
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  // Calendar sync hook for disconnect functionality
  const { disconnect, isDisconnecting } = useCalendarSync({
    providerId: provider?.id || '',
    refetchInterval: 0, // Don't auto-refresh, we only need disconnect functionality
  });

  // Handle disconnect confirmation
  const handleDisconnect = async () => {
    try {
      await disconnect();
      setShowDisconnectDialog(false);
    } catch (error) {
      // Error is handled by the mutation's onError callback
      // No need to log here as toast notification is shown
    }
  };

  // Unsuspend mutation
  const unsuspendMutation = api.providers.unsuspend.useMutation({
    onSuccess: () => {
      utils.providers.getByUserId.invalidate();
      toast({
        title: 'Provider profile reactivated',
        description: 'Your provider profile is now active and can accept bookings.',
      });
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: 'Failed to reactivate profile',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Fetch provider statistics
  const { data: stats } = api.providers.getProviderStats.useQuery(
    { providerId: provider?.id || '' },
    {
      enabled: !!provider?.id,
    }
  );

  if (isLoading) {
    return <ProviderProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load provider profile. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <Alert>
          <AlertDescription>
            No provider profile found. Please contact support if this is an error.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Provider Profile</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your professional information and service offerings
            </p>
          </div>
          <div className="flex gap-2">
            {provider.status === 'SUSPENDED' && (
              <Button
                onClick={() => unsuspendMutation.mutate({})}
                disabled={unsuspendMutation.isPending}
                className="gap-2"
              >
                <PlayCircle className="h-4 w-4" />
                {unsuspendMutation.isPending ? 'Reactivating...' : 'Reactivate Profile'}
              </Button>
            )}
            <Link href="/provider-profile/edit">
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {provider.status !== 'ACTIVE' && (
        <Alert className="mb-6">
          <AlertDescription>
            Your provider profile status is currently{' '}
            <Badge variant={provider.status === 'APPROVED' ? 'default' : 'secondary'}>
              {provider.status}
            </Badge>
            .{' '}
            {provider.status === 'APPROVED' ? (
              <>
                Your requirements have been verified by our admin team. To start accepting bookings,
                please subscribe to one of our plans to activate your profile.
              </>
            ) : provider.status === 'SUSPENDED' ? (
              <>
                Your profile is temporarily suspended. Click the &quot;Reactivate Profile&quot;
                button above to resume accepting bookings.
              </>
            ) : provider.status === 'TRIAL' ? (
              <>
                You are currently in trial period. Subscribe before it expires to continue accepting
                bookings.
              </>
            ) : provider.status === 'TRIAL_EXPIRED' ? (
              <>Your trial has expired. Please subscribe to reactivate your profile.</>
            ) : (
              <>Some features may be limited until your profile is active.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Basic Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-semibold">{provider.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{provider.user.email}</p>
                  </div>

                  {provider.bio && (
                    <div>
                      <h4 className="mb-1 text-sm font-medium">Professional Bio</h4>
                      <p className="text-sm text-muted-foreground">{provider.bio}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="grid gap-3 sm:grid-cols-2">
                    {provider.user.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{provider.user.phone}</span>
                      </div>
                    )}
                    {provider.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Languages */}
                  {provider.languages && provider.languages.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                          <LanguagesIcon className="h-4 w-4" />
                          Languages
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {provider.languages.map((language) => (
                            <Badge key={language} variant="secondary">
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Provider Types */}
                  {provider.typeAssignments && provider.typeAssignments.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                          <Briefcase className="h-4 w-4" />
                          Specializations
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {provider.typeAssignments.map((assignment) => (
                            <Badge key={assignment.id} variant="outline">
                              {assignment.providerType.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Availability Overview */}
              <ProviderAvailabilitySection providerId={provider.id} />

              {/* Calendar Sync */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Calendar Sync
                  </CardTitle>
                  <CardDescription>
                    Manage your Google Calendar integration and sync settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProviderCalendarSyncDashboard
                    providerId={provider.id}
                    onDisconnect={() => setShowDisconnectDialog(true)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business Settings</CardTitle>
                  <CardDescription>
                    Your professional information and display preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProviderBusinessSettingsView provider={provider} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-6">
              <ProviderServicesSection providerId={provider.id} providerStatus={provider.status} />
            </TabsContent>

            <TabsContent value="requirements" className="space-y-6">
              <ProviderRequirementsSection providerId={provider.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Quick Stats & Actions */}
        <div className="space-y-6">
          {/* Quick Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={provider.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {provider.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Profile Views</span>
                <span className="font-medium">Coming soon</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Bookings</span>
                <span className="font-medium">
                  {stats?.totalBookings !== undefined ? stats.totalBookings.toLocaleString() : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">No ratings</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Learn how to optimize your provider profile for better visibility and bookings.
              </p>
              <Link href="/help">
                <Button variant="outline" className="w-full">
                  View Guide
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <DisconnectConfirmationDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
        entityName={provider.name}
        entityType="provider"
        onConfirm={handleDisconnect}
        isDisconnecting={isDisconnecting}
      />
    </div>
  );
}

function ProviderProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-[400px]" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[250px]" />
        </div>
      </div>
    </div>
  );
}
