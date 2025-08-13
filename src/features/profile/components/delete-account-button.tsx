'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
import { useDeleteAccount } from '@/features/profile/hooks/use-profile';
import { toast } from '@/hooks/use-toast';

export function DeleteAccountButton({ hasServiceProvider }: { hasServiceProvider: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const deleteAccountMutation = useDeleteAccount();

  const handleDeleteAccount = async () => {
    try {
      await deleteAccountMutation.mutateAsync();

      toast({
        title: 'Account deleted',
        description: 'Your account has been successfully deleted.',
      });
      router.push('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-border bg-card dark:border-border dark:bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground dark:text-foreground">
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground dark:text-muted-foreground">
            {hasServiceProvider
              ? 'You cannot delete your account while you have an active service provider profile. Please delete your service provider profile first.'
              : 'This action cannot be undone. This will permanently delete your account and remove your data from our servers.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {!hasServiceProvider && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
