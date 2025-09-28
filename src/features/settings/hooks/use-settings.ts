import { api } from '@/utils/api';

export function useSettings() {
  return api.settings.getAll.useQuery();
}

export function useUpdateAccountSettings() {
  const utils = api.useUtils();

  return api.settings.updateAccount.useMutation({
    onSuccess: (updatedUser, variables) => {
      // Optimistically update the cache with the new user data
      utils.settings.getAll.setData(undefined, (old) => {
        if (!old) return old;
        return {
          ...old,
          user: updatedUser,
        };
      });

      // Also invalidate profile data as it might be used elsewhere
      utils.profile.invalidate();
    },
    onError: () => {
      // Invalidate to refetch fresh data on error
      utils.settings.getAll.invalidate();
    },
  });
}

export function useUpdateCommunicationPreferences() {
  const utils = api.useUtils();

  return api.settings.updateCommunicationPreferences.useMutation({
    onSuccess: (updatedPreferences) => {
      // Optimistically update the cache with the new communication preferences
      utils.settings.getAll.setData(undefined, (old) => {
        if (!old) return old;
        return {
          ...old,
          communicationPreferences: updatedPreferences,
        };
      });
    },
    onError: () => {
      // Invalidate to refetch fresh data on error
      utils.settings.getAll.invalidate();
    },
  });
}

export function useUpdateProviderBusinessSettings() {
  const utils = api.useUtils();

  return api.settings.updateProviderBusiness.useMutation({
    onSuccess: () => {
      // Invalidate and refetch settings data
      utils.settings.getAll.invalidate();
      // Also invalidate provider data since it might be used elsewhere
      utils.providers.invalidate();
    },
  });
}

export function useRequestAccountDeletion() {
  return api.settings.requestAccountDeletion.useMutation();
}

export function useSendEmailVerification() {
  const utils = api.useUtils();

  return api.settings.sendEmailVerification.useMutation({
    onSuccess: () => {
      // Invalidate and refetch settings data
      utils.settings.getAll.invalidate();
    },
  });
}
