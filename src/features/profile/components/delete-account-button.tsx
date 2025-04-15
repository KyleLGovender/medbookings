'use client';

import { useState } from 'react';

import { signOut } from 'next-auth/react';

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
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';

import { deleteUser } from '../lib/actions';

interface DeleteAccountButtonProps {
  hasServiceProvider: boolean;
}

export function DeleteAccountButton({ hasServiceProvider }: DeleteAccountButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteUser();

      if (result.success) {
        await signOut({ redirect: true, callbackUrl: '/' });
      } else {
        setIsOpen(false);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to delete account',
        });
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      setIsOpen(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          {isDeleting ? (
            <>
              <Spinner className="mr-2" />
              Deleting...
            </>
          ) : (
            'Delete Account'
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasServiceProvider ? (
              <>
                You currently have a service provider profile. Please delete your service provider
                profile first by going to your service provider dashboard and clicking &ldquo;Delete
                Profile&rdquo; before deleting your account.
              </>
            ) : (
              <>
                This action cannot be undone. This will permanently delete your account and all
                associated data, including your service provider profile if you have one.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || hasServiceProvider}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Spinner className="mr-2" />
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
