'use client';

import { AlertTriangle, Building2, Home, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { type RouterOutputs } from '@/utils/api';

// Extract type from tRPC response
type InvitationValidationResponse = RouterOutputs['providers']['validateInvitation'];
type InvitationData = InvitationValidationResponse['invitation'];

interface InvitationErrorStateProps {
  error: string;
  token: string;
  invitation?: InvitationData;
  isExpired?: boolean;
  showSignOut?: boolean;
}

export function InvitationErrorState({
  error,
  token,
  invitation,
  isExpired = false,
  showSignOut = false,
}: InvitationErrorStateProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: `/invitation/${token}` });
  };

  const getErrorIcon = () => {
    if (isExpired) {
      return <AlertTriangle className="h-12 w-12 text-orange-500" />;
    }
    return <AlertTriangle className="h-12 w-12 text-destructive" />;
  };

  const getErrorTitle = () => {
    if (isExpired) {
      return 'Invitation Expired';
    }
    if (error.includes('already been responded to') || error.includes('already been accepted')) {
      return 'Invitation Already Used';
    }
    if (error.includes('cancelled')) {
      return 'Invitation Cancelled';
    }
    if (error.includes('signed in as')) {
      return 'Wrong Account';
    }
    return 'Invalid Invitation';
  };

  const getErrorDescription = () => {
    if (isExpired && invitation) {
      return `The invitation from ${invitation.organization.name} has expired. Contact them directly if you're still interested in joining.`;
    }
    return error;
  };

  const getActionButtons = () => {
    const buttons = [];

    // Always show home button
    buttons.push(
      <Button
        key="home"
        onClick={() => (window.location.href = '/')}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Home className="h-4 w-4" />
        Go to Homepage
      </Button>
    );

    // Show sign out button if requested
    if (showSignOut) {
      buttons.push(
        <Button
          key="signout"
          onClick={handleSignOut}
          variant="outline"
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      );
    }

    // Show contact organization button for expired invitations
    if (isExpired && invitation) {
      buttons.push(
        <Button
          key="contact"
          onClick={() => (window.location.href = '/search')}
          className="flex items-center gap-2"
        >
          <Building2 className="h-4 w-4" />
          Find Organizations
        </Button>
      );
    }

    return buttons;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-2xl">
        <CardHeader className="pb-4 text-center">
          {invitation?.organization.logo ? (
            <img
              src={invitation.organization.logo}
              alt={invitation.organization.name}
              className="mx-auto mb-4 h-16 w-16 rounded-lg border object-cover opacity-50"
            />
          ) : (
            invitation && (
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-muted opacity-50">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            )
          )}

          <div className="mx-auto mb-4 flex justify-center">{getErrorIcon()}</div>

          <CardTitle className="text-2xl">{getErrorTitle()}</CardTitle>
          <CardDescription className="mx-auto max-w-md text-center">
            {getErrorDescription()}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Additional information for specific error types */}
          {isExpired && invitation && (
            <div className="rounded-lg border bg-orange-50 p-4 dark:bg-orange-950/30">
              <h3 className="mb-2 font-medium text-orange-900 dark:text-orange-100">
                What can you do?
              </h3>
              <ul className="space-y-1 text-sm text-orange-800 dark:text-orange-200">
                <li>
                  • Contact {invitation.organization.name} directly to request a new invitation
                </li>
                <li>• Search for other healthcare organizations on MedBookings</li>
                <li>• Create a provider account and wait for new invitations</li>
              </ul>
            </div>
          )}

          {showSignOut && (
            <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/30">
              <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
                Need to switch accounts?
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Sign out of your current account and sign in with the email address that received
                the invitation.
              </p>
            </div>
          )}

          {error.includes('already been accepted') && invitation && (
            <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/30">
              <h3 className="mb-2 font-medium text-green-900 dark:text-green-100">
                Already Connected!
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200">
                You&apos;re already connected to {invitation.organization.name}. Check your provider
                dashboard to manage your organization connections.
              </p>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col justify-center gap-3 sm:flex-row">{getActionButtons()}</div>

          {/* Help Text */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Need help? Contact MedBookings support or reach out to the organization directly.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
