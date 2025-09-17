import { api } from '@/utils/api';

export function useSettings() {
  return api.settings.getAll.useQuery();
}

export function useUpdateAccountSettings() {
  const utils = api.useUtils();

  return api.settings.updateAccount.useMutation({
    onSuccess: () => {
      // Invalidate and refetch settings data
      utils.settings.getAll.invalidate();
    },
  });
}

export function useUpdateCommunicationPreferences() {
  const utils = api.useUtils();

  return api.settings.updateCommunicationPreferences.useMutation({
    onSuccess: () => {
      // Invalidate and refetch settings data
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
