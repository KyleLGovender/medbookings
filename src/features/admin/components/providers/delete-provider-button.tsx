'use client';

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
import { Spinner } from '@/components/ui/spinner';
import { useDeleteProvider } from '@/features/providers/hooks/use-provider-delete';
import { useNavigation } from '@/hooks/use-navigation';

interface DeleteProviderButtonProps {
  providerId: string;
}

export function DeleteProviderButton({ providerId }: DeleteProviderButtonProps) {
  const { navigate } = useNavigation();
  const deleteProviderMutation = useDeleteProvider();

  const handleDelete = async () => {
    try {
      await deleteProviderMutation.mutateAsync({ id: providerId });
      await navigate('/profile');
    } catch (error) {
      console.error('Error deleting provider:', error);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full max-w-64">
          {deleteProviderMutation.isPending ? (
            <>
              <Spinner className="mr-2" />
              Deleting...
            </>
          ) : (
            'Delete Provider Profile'
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your provider profile and all
            associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>OK</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteProviderMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteProviderMutation.isPending ? (
              <>
                <Spinner className="mr-2" />
                Deleting...
              </>
            ) : (
              'Delete Provider Profile'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
