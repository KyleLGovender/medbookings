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
import { useDeleteOrganization } from '@/features/organizations/hooks/use-delete-organization';
import { useToast } from '@/hooks/use-toast';

interface DeleteOrganizationButtonProps {
  organizationId: string;
  organizationName: string;
  redirectPath: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function DeleteOrganizationButton({
  organizationId,
  organizationName,
  redirectPath,
  variant = 'destructive',
  size = 'default',
  className,
}: DeleteOrganizationButtonProps) {
  const router = useRouter();
  const { toast } = useToast();

  const { mutate: deleteOrganizationMutation } = useDeleteOrganization({ redirectPath });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Trash2 className="h-4 w-4" />
          Delete Organization
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the organization &quot;
            {organizationName}&quot; and remove its data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteOrganizationMutation(organizationId)}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
