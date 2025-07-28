import { useRouter } from 'next/navigation';

import { useToast } from '@/hooks/use-toast';
import { api } from '@/utils/api';

interface UseDeleteOrganizationProps {
  redirectPath?: string;
}

export function useDeleteOrganization({ redirectPath }: UseDeleteOrganizationProps = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const utils = api.useUtils();

  return api.organizations.delete.useMutation({
    onSuccess: (_, variables) => {
      utils.organizations.getById.invalidate({ id: variables.id });
      utils.organizations.getByUserId.invalidate();
      toast({
        title: 'Organization Deleted',
        description: 'The organization has been successfully deleted.',
      });
      if (redirectPath) {
        router.push(redirectPath);
      }
    },
    onError: (error) => {
      toast({
        title: 'Deletion Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });
}
