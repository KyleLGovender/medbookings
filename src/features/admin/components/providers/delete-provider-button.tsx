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
import { useAdminDeleteProvider } from '@/features/admin/hooks/use-admin-delete-provider';
import { useNavigation } from '@/hooks/use-navigation';
import { logger } from '@/lib/logger';

interface DeleteProviderButtonProps {
  providerId: string;
}

export function DeleteProviderButton({ providerId }: DeleteProviderButtonProps) {
  const { navigate } = useNavigation();
  const deleteProviderMutation = useAdminDeleteProvider();

  const handleDelete = async () => {
    try {
      await deleteProviderMutation.mutateAsync({ id: providerId });
      await navigate('/profile');
    } catch (error) {
      logger.error('Error deleting provider', {
        providerId,
        error: error instanceof Error ? error.message : String(error),
      });
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
