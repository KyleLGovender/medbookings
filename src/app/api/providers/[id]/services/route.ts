import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { updateProviderServices } from '@/features/providers/lib/actions/update-provider';
import { authOptions } from '@/lib/auth';

/**
 * PUT handler for updating provider services
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
    const result = await updateProviderServices({}, formData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update services' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating provider services:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating provider services' },
      { status: 500 }
    );
  }
}
