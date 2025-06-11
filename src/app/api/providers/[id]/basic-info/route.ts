import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { updateProviderBasicInfo } from '@/features/providers/lib/actions/update-provider';
import { authOptions } from '@/lib/auth';
import { providerDebug } from '@/lib/debug';

/**
 * PUT handler for updating provider basic information
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      providerDebug.error('api', 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    formData.append('id', params.id);

    // Log form data entries
    providerDebug.log('api', 'Form data entries:');
    Array.from(formData.entries()).forEach(([key, value]) => {
      providerDebug.log('api', `${key}: ${value}`);
    });

    const result = await updateProviderBasicInfo({}, formData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update basic information' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update basic information' }, { status: 500 });
  }
}
