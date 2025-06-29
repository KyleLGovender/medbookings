'use client';

import { useState } from 'react';

import { format, formatDistanceToNow } from 'date-fns';
import { Building2, Check, Globe, Mail, MessageSquare, Phone, User, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface InvitationData {
  id: string;
  email: string;
  customMessage?: string;
  status: string;
  expiresAt: string;
  organization: {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  invitedBy: {
    name?: string;
    email?: string;
  };
}

interface ExistingUserInvitationFlowProps {
  invitation: InvitationData;
  token: string;
  user: any;
}

export function ExistingUserInvitationFlow({
  invitation,
  token,
  user,
}: ExistingUserInvitationFlowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [responseSubmitted, setResponseSubmitted] = useState(false);
  const [responseType, setResponseType] = useState<'accept' | 'reject' | null>(null);
  const { toast } = useToast();

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/providers/invitations/${token}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'accept' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept invitation');
      }

      const data = await response.json();
      setResponseSubmitted(true);
      setResponseType('accept');

      toast({
        title: 'Invitation Accepted!',
        description: `You have successfully joined ${invitation.organization.name}.`,
      });

      // Redirect to provider dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/profile';
      }, 2000);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Failed to accept invitation',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/providers/invitations/${token}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          rejectionReason: rejectionReason || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject invitation');
      }

      setResponseSubmitted(true);
      setResponseType('reject');
      setIsRejectDialogOpen(false);

      toast({
        title: 'Invitation Declined',
        description: 'You have declined the invitation.',
      });
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast({
        title: 'Failed to decline invitation',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (responseSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            {responseType === 'accept' ? (
              <div className="space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="mb-2 text-2xl font-bold text-green-800 dark:text-green-200">
                    Welcome to {invitation.organization.name}!
                  </h1>
                  <p className="text-muted-foreground">
                    You have successfully joined the organization. You can now schedule availability
                    and start working with them.
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Redirecting to your dashboard...
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <X className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h1 className="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-200">
                    Invitation Declined
                  </h1>
                  <p className="text-muted-foreground">
                    You have declined the invitation from {invitation.organization.name}.
                  </p>
                </div>
                <Button onClick={() => (window.location.href = '/profile')} variant="outline">
                  Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-2xl">
          <CardHeader className="pb-4 text-center">
            <div className="mx-auto mb-4">
              {invitation.organization.logo ? (
                <img
                  src={invitation.organization.logo}
                  alt={invitation.organization.name}
                  className="mx-auto h-16 w-16 rounded-lg border object-cover"
                />
              ) : (
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl">Join {invitation.organization.name}</CardTitle>
            <CardDescription>
              You&apos;ve been invited to join this organization on MedBookings
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Welcome Message */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Welcome back, <span className="font-medium">{user.name || user.email}</span>!
              </p>
            </div>

            {/* Organization Info */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="mb-3 font-semibold">{invitation.organization.name}</h3>

              {invitation.organization.description && (
                <p className="mb-3 text-sm text-muted-foreground">
                  {invitation.organization.description}
                </p>
              )}

              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {invitation.organization.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{invitation.organization.email}</span>
                  </div>
                )}
                {invitation.organization.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{invitation.organization.phone}</span>
                  </div>
                )}
                {invitation.organization.website && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={invitation.organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-primary hover:underline"
                    >
                      {invitation.organization.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Message */}
            {invitation.customMessage && (
              <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/30">
                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="mb-1 font-medium text-blue-900 dark:text-blue-100">
                      Personal Message:
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-blue-800 dark:text-blue-200">
                      {invitation.customMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Invitation Details */}
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Invited by:</span>
                </div>
                <p className="ml-6 text-muted-foreground">
                  {invitation.invitedBy?.name || 'Unknown'}
                </p>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Invitation expires:</span>
                </div>
                <p className="ml-6 text-muted-foreground">
                  {format(new Date(invitation.expiresAt), 'MMM d, yyyy')}
                  <span className="ml-2 text-xs">
                    ({formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })})
                  </span>
                </p>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleAccept}
                disabled={isLoading}
                className="flex flex-1 items-center gap-2"
                size="lg"
              >
                <Check className="h-4 w-4" />
                {isLoading ? 'Accepting...' : 'Accept Invitation'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsRejectDialogOpen(true)}
                disabled={isLoading}
                className="flex flex-1 items-center gap-2"
                size="lg"
              >
                <X className="h-4 w-4" />
                Decline
              </Button>
            </div>

            {/* What happens next */}
            <div className="text-center text-sm text-muted-foreground">
              <p>
                By accepting, you&apos;ll be able to schedule availability with{' '}
                {invitation.organization.name}
                and start offering your services through their organization.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline the invitation from {invitation.organization.name}?
              You can optionally provide a reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Textarea
                placeholder="Let them know why you're declining..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isLoading}>
              {isLoading ? 'Declining...' : 'Decline Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
