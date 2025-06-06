import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { updateServiceProvider } from '@/features/providers/lib/actions';
import { authOptions } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the provider ID from the URL
    const { id } = params;

    // Get form data
    const formData = await request.formData();

    // Add the ID to the form data
    formData.append('id', id);

    // Call the server action to update the provider
    const result = await updateServiceProvider({}, formData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update service provider' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in PUT /api/providers/[id]:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the service provider' },
      { status: 500 }
    );
  }
}
