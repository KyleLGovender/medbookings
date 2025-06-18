import { useRouter } from 'next/navigation';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/hooks/use-toast';

interface UseDeleteOrganizationProps {
  redirectPath?: string;
}

export function useDeleteOrganization({ redirectPath }: UseDeleteOrganizationProps = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete organization');
      }
    },
    onSuccess: (_, organizationId) => {
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] }); // Invalidate list of organizations
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
