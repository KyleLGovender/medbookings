'use client';

import { ProfileClient } from '@/features/profile/components/profile-client';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useProviderByUserId } from '@/features/providers/hooks/use-provider-by-user-id';

export function ProfileClientPage() {
  // Fetch the user profile
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useProfile();
  // Fetch the service provider profile if the user is a provider
  const { data: provider, isLoading: isProviderLoading } = useProviderByUserId(profile?.id);

  return (
    <>
      {profile && (
        <ProfileClient
          profile={profile}
          provider={provider}
          isProfileLoading={isProfileLoading}
          profileError={profileError}
          hasServiceProvider={!!provider}
        />
      )}
    </>
  );
}
