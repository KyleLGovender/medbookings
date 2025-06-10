'use client';

import { useRouter } from 'next/navigation';

import { Trash2 } from 'lucide-react';

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
import { useDeleteProvider } from '@/features/providers/hooks/use-delete-provider';
import { useToast } from '@/hooks/use-toast';

interface DeleteProviderButtonProps {
  providerId: string;
  providerName?: string;
  redirectPath?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * Button component with confirmation dialog for deleting a provider
 */
export function DeleteProviderButton({
  providerId,
  providerName = 'this provider',
  redirectPath,
  variant = 'destructive',
  size = 'default',
  className,
}: DeleteProviderButtonProps) {
  const router = useRouter();
  const { toast } = useToast();

  const { mutate: deleteProvider, isPending } = useDeleteProvider({
    onSuccess: () => {
      toast({
        title: 'Provider deleted',
        description: `${providerName} has been successfully deleted.`,
      });

      // Redirect if a path was provided
      if (redirectPath) {
        router.push(redirectPath);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete provider',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    deleteProvider(providerId);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Trash2 className="h-4 w-4" />
          Delete Provider
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete {providerName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the provider and all
            associated data, including services, requirements, and appointment history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
