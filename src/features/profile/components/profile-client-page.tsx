'use client';

import { ProfileClient } from '@/features/profile/components/profile-client';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useServiceProviderByUserId } from '@/features/providers/hooks/use-service-provider-by-user-id';

export function ProfileClientPage() {
  // Fetch the user profile
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useProfile();
  // Fetch the service provider profile if the user is a provider
  const { data: provider, isLoading: isProviderLoading } = useServiceProviderByUserId(profile?.id);

  return (
    <>
      {profile && (
        <ProfileClient
          profile={profile}
          isProfileLoading={isProfileLoading}
          profileError={profileError}
          hasServiceProvider={!!provider}
        />
      )}
    </>
  );
}
