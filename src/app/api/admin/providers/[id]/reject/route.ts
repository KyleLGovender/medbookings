import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providerId = params.id;
    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    // Check if provider exists
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
      select: { id: true, name: true, email: true },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Reject the provider
    const updatedProvider = await prisma.serviceProvider.update({
      where: { id: providerId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason.trim(),
        approvedById: null,
        approvedAt: null,
      },
    });

    // Console log for future email integration
    console.log('ADMIN_ACTION: Provider rejected', {
      providerId: provider.id,
      providerName: provider.name,
      providerEmail: provider.email,
      adminId: currentUser.id,
      adminEmail: currentUser.email,
      rejectionReason: reason.trim(),
      timestamp: new Date().toISOString(),
      action: 'PROVIDER_REJECTED',
    });

    return NextResponse.json({
      success: true,
      data: updatedProvider,
      message: 'Provider rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
