'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { signOut } from 'next-auth/react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/utils/api';

import { useRequestAccountDeletion } from '../hooks/use-settings';

export default function AccountDeletionSection() {
  const { toast } = useToast();
  const router = useRouter();
  const deleteAccountMutation = api.profile.delete.useMutation();
  const requestAccountDeletion = useRequestAccountDeletion();
  const { data: profile } = api.profile.get.useQuery();
  const { data: provider } = api.providers.getByUserId.useQuery(
    { userId: profile?.id ?? '' },
    { enabled: !!profile?.id }
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const hasServiceProvider = !!provider;

  const handleAccountDeletion = async () => {
    try {
      // Use profile deletion which does the actual deletion
      await deleteAccountMutation.mutateAsync();

      toast({
        title: 'Account deleted',
        description: 'Your account has been successfully deleted.',
      });

      // Sign out and redirect to home page
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description:
          error instanceof Error ? error.message : 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Password & Security</CardTitle>
          <CardDescription>Manage your account password and security settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Password management is handled through Google OAuth. To change your password, please
              update it in your Google account settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Account Deletion Section */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription>Permanently delete your account and all associated data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasServiceProvider ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Cannot delete account:</strong> You have an active service provider profile.
                Please delete your service provider profile first before deleting your account.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This action cannot be undone. All your data, including
                  appointments and organizations will be permanently deleted.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-medium">Before deleting your account:</h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Cancel any upcoming appointments</li>
                  <li>Download any important data you want to keep</li>
                  <li>Remove yourself from any organizations</li>
                </ul>
              </div>
            </>
          )}

          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={hasServiceProvider}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  {hasServiceProvider ? (
                    <p>
                      You cannot delete your account while you have an active service provider
                      profile. Please delete your service provider profile first.
                    </p>
                  ) : (
                    <>
                      <p>
                        This action cannot be undone. This will permanently delete your account and
                        remove all your data from our servers.
                      </p>
                      <p className="font-medium">This includes:</p>
                      <ul className="list-inside list-disc space-y-1 text-sm">
                        <li>Your profile and personal information</li>
                        <li>All appointment history</li>
                        <li>Organization memberships</li>
                        <li>Communication preferences</li>
                      </ul>
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                {!hasServiceProvider && (
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      handleAccountDeletion();
                    }}
                    disabled={deleteAccountMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteAccountMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Yes, delete my account'
                    )}
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
