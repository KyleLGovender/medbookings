'use client';

import { useEffect, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';
import { type RouterOutputs, api } from '@/utils/api';

// Infer types from tRPC router outputs
type InvitationsResponse = RouterOutputs['providers']['getInvitations'];
type Invitation = InvitationsResponse['invitations'][number];

interface PendingInvitation {
  token: string;
  organizationName: string;
  email: string;
}

interface PostRegistrationInvitationHandlerProps {
  onInvitationHandled?: () => void;
}

export function PostRegistrationInvitationHandler({
  onInvitationHandled,
}: PostRegistrationInvitationHandlerProps) {
  const { data: session, status } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all pending invitations for the current user
  const { data: pendingInvitations, isLoading: isLoadingInvitations } =
    api.providers.getInvitations.useQuery(
      { status: 'PENDING' },
      {
        enabled: status === 'authenticated',
        retry: false,
      }
    );

  // Get the first pending invitation (we'll show one at a time)
  const invitationsArray = pendingInvitations?.invitations || [];
  const pendingInvitation = invitationsArray.length > 0 ? invitationsArray[0] : null;

  // Optimistic update mutation for quick banner acceptance
  const acceptInvitationMutation = api.providers.respondToInvitation.useMutation({
    onMutate: async (variables) => {
      setIsProcessing(true);

      // Cancel outgoing queries
      await queryClient.cancelQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('getInvitations');
        },
      });

      // Snapshot current data
      const cache = queryClient.getQueryCache();
      const allQueries = cache.getAll();
      let previousData;
      let actualKey;

      for (const query of allQueries) {
        const keyStr = JSON.stringify(query.queryKey);
        if (keyStr.includes('getInvitations')) {
          actualKey = query.queryKey;
          previousData = query.state.data;
          break;
        }
      }

      // Optimistically update: remove the accepted invitation from pending list
      if (previousData && actualKey) {
        queryClient.setQueryData(actualKey, (old: InvitationsResponse | undefined) => {
          if (!old?.invitations || !Array.isArray(old.invitations)) return old;

          return {
            ...old,
            invitations: old.invitations.filter((inv: Invitation) => inv.token !== variables.token),
          };
        });
      }

      return { previousData, actualKey };
    },

    onError: (err, variables, context) => {
      logger.error('Banner invitation acceptance failed, rolling back', {
        error: err instanceof Error ? err.message : String(err),
      });

      // Roll back to previous state
      if (context?.previousData && context?.actualKey) {
        queryClient.setQueryData(context.actualKey, context.previousData);
      }

      setIsProcessing(false);
    },

    onSuccess: async () => {
      // Invalidate all invitation-related queries
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return (
            keyStr.includes('getInvitations') ||
            keyStr.includes('validate') ||
            keyStr.includes('getProviderConnections')
          );
        },
      });

      setIsProcessing(false);
      onInvitationHandled?.();
    },
  });

  const handleAcceptInvitation = () => {
    if (pendingInvitation) {
      acceptInvitationMutation.mutate({
        token: pendingInvitation.token,
        action: 'accept',
      });
    }
  };

  const handleSkipInvitation = () => {
    // Just trigger the callback to hide the banner
    // The invitation will still be available in the database
    onInvitationHandled?.();
  };

  // Don't render if no pending invitation or still loading
  if (status === 'loading' || isLoadingInvitations || !pendingInvitation) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg">Complete Your Invitation</CardTitle>
        <CardDescription>
          You have a pending invitation from {pendingInvitation.organization.name} that you can now
          accept.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>
            You can accept this invitation from{' '}
            <strong>{pendingInvitation.organization.name}</strong> to join their organization.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleAcceptInvitation}
            disabled={acceptInvitationMutation.isPending}
            className="flex-1"
          >
            {acceptInvitationMutation.isPending ? 'Accepting...' : 'Accept Invitation'}
          </Button>
          <Button
            variant="outline"
            onClick={handleSkipInvitation}
            disabled={acceptInvitationMutation.isPending}
            className="flex-1"
          >
            Skip for Now
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          You can always accept this invitation later from your provider dashboard.
        </p>
      </CardContent>
    </Card>
  );
}
