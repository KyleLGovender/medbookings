'use client';

import { useEffect, useState } from 'react';

import { ProviderInvitationStatus } from '@prisma/client';
import { useSession } from 'next-auth/react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type RouterOutputs, api } from '@/utils/api';

import { ExistingUserInvitationFlow } from './existing-user-invitation-flow';
import { InvitationErrorState } from './invitation-error-state';
import { NewUserInvitationFlow } from './new-user-invitation-flow';

// Infer types from tRPC router outputs
type InvitationValidationResponse = RouterOutputs['providers']['validateInvitation'];
type InvitationData = InvitationValidationResponse['invitation'];

interface InvitationPageContentProps {
  token: string;
}

export function InvitationPageContent({ token }: InvitationPageContentProps) {
  const { data: session, status } = useSession();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use tRPC query for invitation validation
  const invitationQuery = api.providers.validateInvitation.useQuery(
    { token },
    {
      enabled: !!token,
      retry: false,
    }
  );

  useEffect(() => {
    if (invitationQuery.data) {
      setInvitation(invitationQuery.data.invitation);
      setIsLoading(false);
    } else if (invitationQuery.error) {
      setError(invitationQuery.error.message);
      setIsLoading(false);
    } else if (invitationQuery.isLoading) {
      setIsLoading(true);
    }
  }, [invitationQuery.data, invitationQuery.error, invitationQuery.isLoading]);

  // Loading state
  if (isLoading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="space-y-4 text-center">
                <Skeleton className="mx-auto h-8 w-64" />
                <Skeleton className="mx-auto h-4 w-48" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !invitation) {
    return <InvitationErrorState error={error || 'Invitation not found'} token={token} />;
  }

  // Check if invitation is expired
  const expiresAt =
    invitation.expiresAt instanceof Date ? invitation.expiresAt : new Date(invitation.expiresAt);
  const isExpired = expiresAt < new Date();
  if (isExpired) {
    return (
      <InvitationErrorState error="This invitation has expired" token={token} isExpired={true} />
    );
  }

  // Check if invitation is already used
  if (invitation.status !== ProviderInvitationStatus.PENDING) {
    let statusMessage = 'This invitation has already been responded to';
    if (invitation.status === ProviderInvitationStatus.ACCEPTED) {
      statusMessage = 'This invitation has already been accepted';
    } else if (invitation.status === ProviderInvitationStatus.REJECTED) {
      statusMessage = 'This invitation has been declined';
    } else if (invitation.status === ProviderInvitationStatus.CANCELLED) {
      statusMessage = 'This invitation has been cancelled';
    }

    return <InvitationErrorState error={statusMessage} token={token} invitation={invitation} />;
  }

  // Determine user flow based on authentication status and email match
  const isAuthenticated = !!session?.user;
  const userEmail = session?.user?.email;
  const invitationEmail = invitation.email;

  // Check if authenticated user's email matches invitation email
  const isCorrectUser = isAuthenticated && userEmail === invitationEmail;

  if (isAuthenticated && isCorrectUser) {
    // Existing user flow - direct invitation acceptance
    return <ExistingUserInvitationFlow invitation={invitation} token={token} user={session.user} />;
  } else if (isAuthenticated && !isCorrectUser) {
    // Wrong user is logged in
    return (
      <InvitationErrorState
        error={`This invitation is for ${invitationEmail}, but you are signed in as ${userEmail}. Please sign out and sign in with the correct account.`}
        token={token}
        invitation={invitation}
        showSignOut={true}
      />
    );
  } else {
    // New user flow - introduction and registration guidance
    return <NewUserInvitationFlow invitation={invitation} token={token} />;
  }
}
