'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { PostRegistrationInvitationHandler } from '@/features/invitations/components/post-registration-invitation-handler';
import { ProfileClient } from '@/features/profile/components/profile-client';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useProviderByUserId } from '@/features/providers/hooks/use-provider-by-user-id';

export function ProfileClientPage() {
  // Fetch the user profile
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useProfile();
  // Fetch the service provider profile if the user is a provider
  const { data: provider, isLoading: isProviderLoading } = useProviderByUserId(profile?.id);

  // Show loading spinner while profile is loading
  if (isProfileLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading your profile...</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Spinner className="h-8 w-8" />
              <p className="text-sm text-muted-foreground">Loading your profile information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Handle pending invitations */}
      <div className="mb-6">
        <PostRegistrationInvitationHandler />
      </div>

      {profile && (
        <ProfileClient
          profile={profile}
          provider={provider}
          isProfileLoading={isProfileLoading}
          profileError={profileError as Error | null}
          hasServiceProvider={!!provider}
        />
      )}
    </>
  );
}
