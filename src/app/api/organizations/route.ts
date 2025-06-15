import { NextRequest, NextResponse } from 'next/server';

import { registerOrganization } from '@/features/organizations/lib/actions';
import { organizationRegistrationSchema } from '@/features/organizations/types/types';

/**
 * POST /api/organizations
 * Creates a new organization with associated locations
 */
export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json();

    // Validate against schema
    const validationResult = organizationRegistrationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Register the organization
    const organization = await registerOrganization(validationResult.data);

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);

    if ((error as Error).message === 'User not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
  }
}
