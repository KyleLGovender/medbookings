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
import { Spinner } from '@/components/ui/spinner';

import { deleteServiceProvider } from '../../../providers/lib/actions';

interface DeleteServiceProviderButtonProps {
  serviceProviderId: string;
}

export function DeleteServiceProviderButton({
  serviceProviderId,
}: DeleteServiceProviderButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteServiceProvider(serviceProviderId);

      if (result.success) {
        router.push('/profile');
      } else {
        // You might want to show an error toast here
        console.error('Failed to delete service provider:', result.error);
      }
    } catch (error) {
      console.error('Error deleting service provider:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full max-w-64">
          {isDeleting ? (
            <>
              <Spinner className="mr-2" />
              Deleting...
            </>
          ) : (
            'Delete Service Provider Profile'
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your service provider profile
            and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Spinner className="mr-2" />
                Deleting...
              </>
            ) : (
              'Delete Service Provider Profile'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
