'use client';

import { useState } from 'react';

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

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

import { useRequestAccountDeletion } from '../hooks/use-settings';

export default function AccountDeletionSection() {
  const { toast } = useToast();
  const requestDeletion = useRequestAccountDeletion();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAccountDeletion = async () => {
    try {
      const result = await requestDeletion.mutateAsync();
      setIsDialogOpen(false);
      toast({
        title: 'Deletion request submitted',
        description: result.message,
      });
    } catch (error) {
      toast({
        title: 'Request failed',
        description: 'Failed to submit account deletion request. Please try again.',
        variant: 'destructive',
      });
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
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action cannot be undone. All your data, including
              appointments, provider profiles, and organizations will be permanently deleted.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="font-medium">Before deleting your account:</h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Cancel any upcoming appointments</li>
              <li>Download any important data you want to keep</li>
              <li>Remove yourself from any organizations</li>
              <li>Deactivate your provider profile if you have one</li>
            </ul>
          </div>

          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    This action cannot be undone. This will permanently delete your account and
                    remove all your data from our servers.
                  </p>
                  <p className="font-medium">This includes:</p>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    <li>Your profile and personal information</li>
                    <li>All appointment history</li>
                    <li>Provider profile and business information</li>
                    <li>Organization memberships</li>
                    <li>Communication preferences</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleAccountDeletion}
                  disabled={requestDeletion.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {requestDeletion.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Yes, delete my account'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
