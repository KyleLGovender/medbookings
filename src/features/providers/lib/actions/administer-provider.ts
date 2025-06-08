'use server';

import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function approveServiceProvider(serviceProviderId: string) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // Update service provider status
    const updatedProvider = await prisma.serviceProvider.update({
      where: { id: serviceProviderId },
      data: {
        status: 'APPROVED',
        verifiedAt: new Date(),
      },
    });

    // Optional: Send notification to service provider
    await prisma.notificationLog.create({
      data: {
        type: 'BOOKING_CONFIRMATION',
        channel: 'EMAIL',
        content: 'Your service provider account has been approved!',
        status: 'SENT',
        serviceProviderName: updatedProvider.name,
      },
    });

    return { success: true, data: updatedProvider };
  } catch (error) {
    console.error('Error approving service provider:', error);
    return { success: false, error: 'Failed to approve service provider' };
  }
}

export async function suspendServiceProvider(serviceProviderId: string) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // Update service provider status
    const updatedProvider = await prisma.serviceProvider.update({
      where: { id: serviceProviderId },
      data: {
        status: 'SUSPENDED',
      },
    });

    // Create notification log
    await prisma.notificationLog.create({
      data: {
        type: 'BOOKING_CONFIRMATION',
        channel: 'EMAIL',
        content:
          'Your service provider account has been suspended. Please contact support for more information.',
        status: 'SENT',
        serviceProviderName: updatedProvider.name,
      },
    });

    return { success: true, data: updatedProvider };
  } catch (error) {
    console.error('Error suspending service provider:', error);
    return { success: false, error: 'Failed to suspend service provider' };
  }
}
