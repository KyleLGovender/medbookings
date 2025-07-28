'use client';

import { PostRegistrationInvitationHandler } from '@/features/invitations/components/post-registration-invitation-handler';
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
      {/* Handle pending invitations */}
      <div className="mb-6">
        <PostRegistrationInvitationHandler />
      </div>

      {profile && (
        <ProfileClient
          profile={profile as any}
          provider={provider}
          isProfileLoading={isProfileLoading}
          profileError={profileError as any}
          hasServiceProvider={!!provider}
        />
      )}
    </>
  );
}
