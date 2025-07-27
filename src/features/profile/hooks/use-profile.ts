'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  DeleteAccountResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from '@/features/profile/types/types';
import { api } from '@/utils/api';

// Fetch the user profile
export function useProfile() {
  return api.profile.get.useQuery();
}

// Update the user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<UpdateProfileResponse, Error, UpdateProfileRequest>({
    mutationFn: async (data) => {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate the profile query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      // Optionally update the cache directly
      if (data.user) {
        queryClient.setQueryData(['profile'], data.user);
      }
    },
  });
}

// Delete the user account
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation<DeleteAccountResponse, Error, void>({
    mutationFn: async () => {
      const response = await fetch('/api/profile', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }

      return response.json();
    },
    onSuccess: () => {
      // Clear all queries from the cache
      queryClient.clear();
    },
  });
}
