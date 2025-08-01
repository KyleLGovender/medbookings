'use client';

import { useQueryClient } from '@tanstack/react-query';

import { api } from '@/utils/api';

// Fetch the user profile
export function useProfile() {
  return api.profile.get.useQuery();
}

// Update the user profile
export function useUpdateProfile() {
  const utils = api.useUtils();

  return api.profile.update.useMutation({
    onSuccess: (data) => {
      // Invalidate the profile query to refetch the updated data
      utils.profile.get.invalidate();

      // Optionally update the cache directly
      utils.profile.get.setData(undefined, data);
    },
  });
}

// Delete the user account
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return api.profile.delete.useMutation({
    onSuccess: () => {
      // Clear all queries from the cache
      queryClient.clear();
    },
  });
}
