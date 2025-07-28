import { api } from '@/utils/api';

/**
 * Hook for registering a new organization
 * @returns Mutation object for registering an organization
 */
export function useRegisterOrganization() {
  const utils = api.useUtils();

  return api.organizations.create.useMutation({
    onSuccess: () => {
      // Invalidate relevant queries when a new organization is created
      utils.organizations.getByUserId.invalidate();
    },
  });
}
