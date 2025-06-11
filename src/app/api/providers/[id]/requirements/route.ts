import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { updateProviderRequirements } from '@/features/providers/lib/actions/update-provider';
import { authOptions } from '@/lib/auth';
import { providerDebug } from '@/lib/debug';

/**
 * PUT handler for updating provider regulatory requirements
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  providerDebug.log('api', 'PUT /api/providers/[id]/requirements - Starting request processing');
  providerDebug.log('api', 'Provider ID:', params.id);
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
    const result = await updateProviderRequirements({}, formData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update requirements' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating provider requirements:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating provider requirements' },
      { status: 500 }
    );
  }
}
