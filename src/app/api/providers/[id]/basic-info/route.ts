import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { updateProviderBasicInfo } from '@/features/providers/lib/actions/update-provider';
import { authOptions } from '@/lib/auth';

/**
 * PUT handler for updating provider basic information
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    formData.append('id', params.id);

    // Call the server action
    const result = await updateProviderBasicInfo({}, formData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update basic information' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating provider basic info:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating provider basic information' },
      { status: 500 }
    );
  }
}
