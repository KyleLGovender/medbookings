'use server';

import { getCurrentUser } from '@/lib/auth';

/**
 * Validate profile update and handle business logic
 * OPTION C: Business logic only - returns minimal metadata for tRPC procedure
 */
export async function validateProfileUpdate(data: {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
}): Promise<{
  success: boolean;
  validatedData?: typeof data & { userId: string };
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Business logic validations
    if (data.email && data.email.trim().length === 0) {
      return { success: false, error: 'Email cannot be empty' };
    }

    if (data.name && data.name.trim().length === 0) {
      return { success: false, error: 'Name cannot be empty' };
    }

    // Email format validation
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { success: false, error: 'Invalid email format' };
    }

    // Phone format validation (basic)
    if (data.phone && data.phone.length > 0 && !/^[+]?[\d\s\-()]+$/.test(data.phone)) {
      return { success: false, error: 'Invalid phone number format' };
    }

    // WhatsApp format validation (basic)
    if (data.whatsapp && data.whatsapp.length > 0 && !/^[+]?[\d\s\-()]+$/.test(data.whatsapp)) {
      return { success: false, error: 'Invalid WhatsApp number format' };
    }

    // TODO: Send profile update notification
    console.log(`📧 Profile update notification would be sent to: ${currentUser.email}`);

    return {
      success: true,
      validatedData: {
        ...data,
        userId: currentUser.id,
      },
    };
  } catch (error) {
    console.error('Profile update validation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate profile update',
    };
  }
}

/**
 * Validate account deletion and handle business logic
 * OPTION C: Business logic only - returns minimal metadata for tRPC procedure
 */
export async function validateAccountDeletion(): Promise<{
  success: boolean;
  validatedData?: {
    userId: string;
    userEmail: string;
  };
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Business logic checks would go here
    // For example: check for active subscriptions, pending obligations, etc.

    // TODO: Send account deletion notification
    console.log(`📧 Account deletion notification would be sent to: ${currentUser.email}`);

    return {
      success: true,
      validatedData: {
        userId: currentUser.id,
        userEmail: currentUser.email,
      },
    };
  } catch (error) {
    console.error('Account deletion validation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate account deletion',
    };
  }
}
