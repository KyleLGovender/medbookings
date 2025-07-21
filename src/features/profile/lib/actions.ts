'use server';

import { revalidatePath } from 'next/cache';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function checkServiceProvider(userId: string) {
  const provider = await prisma.provider.findFirst({
    where: { userId },
  });
  return !!provider;
}

export async function deleteUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const hasServiceProvider = await checkServiceProvider(session.user.id);
  if (hasServiceProvider) {
    return {
      success: false,
      error: 'Please delete your service provider profile first before deleting your account.',
    };
  }

  try {
    // Delete the user and all related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete account connections (OAuth)
      await tx.account.deleteMany({
        where: { userId: session.user.id },
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id: session.user.id },
      });
    });

    // Revalidate the profile page
    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    console.error('Delete user error:', error);
    return {
      success: false,
      error: 'Failed to delete account. Please try again or contact support.',
    };
  }
}
