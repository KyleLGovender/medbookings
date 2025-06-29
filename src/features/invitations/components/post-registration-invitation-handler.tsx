'use client';

import { useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [pendingInvitation, setPendingInvitation] = useState<PendingInvitation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check for pending invitation after user is authenticated
    if (status === 'authenticated' && session?.user?.email) {
      const storedInvitation = localStorage.getItem('pendingInvitation');

      if (storedInvitation) {
        try {
          const invitation: PendingInvitation = JSON.parse(storedInvitation);

          // Verify the invitation email matches the authenticated user's email
          if (invitation.email === session.user.email) {
            setPendingInvitation(invitation);
          } else {
            // Clear invalid invitation
            localStorage.removeItem('pendingInvitation');
          }
        } catch (error) {
          console.error('Error parsing pending invitation:', error);
          localStorage.removeItem('pendingInvitation');
        }
      }
    }
  }, [status, session]);

  const handleAcceptInvitation = () => {
    if (pendingInvitation) {
      setIsProcessing(true);
      // Redirect to the invitation page to complete the acceptance
      window.location.href = `/invitation/${pendingInvitation.token}`;
    }
  };

  const handleSkipInvitation = () => {
    localStorage.removeItem('pendingInvitation');
    setPendingInvitation(null);
    onInvitationHandled?.();
  };

  // Don't render if no pending invitation or still loading
  if (status === 'loading' || !pendingInvitation) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg">Complete Your Invitation</CardTitle>
        <CardDescription>
          You have a pending invitation from {pendingInvitation.organizationName} that you can now
          accept.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>
            Now that you&apos;ve created your MedBookings account, you can accept the invitation
            from <strong>{pendingInvitation.organizationName}</strong> to join their organization.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleAcceptInvitation} disabled={isProcessing} className="flex-1">
            {isProcessing ? 'Processing...' : 'Accept Invitation'}
          </Button>
          <Button
            variant="outline"
            onClick={handleSkipInvitation}
            disabled={isProcessing}
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
