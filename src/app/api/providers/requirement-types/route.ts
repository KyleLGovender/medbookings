import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET handler for /api/providers/requirement-types
 * Fetches requirement types for a provider type
 * Query parameters:
 * - providerTypeId: ID of the provider type to fetch requirements for
 * - providerId: ID of the provider to check which requirements are already submitted
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = request.nextUrl;
    const providerTypeId = searchParams.get('providerTypeId');
    const providerId = searchParams.get('providerId');

    // Validate required parameters
    if (!providerTypeId) {
      return NextResponse.json({ error: 'Provider type ID is required' }, { status: 400 });
    }

    // Fetch provider type with its requirements
    const providerType = await prisma.providerType.findUnique({
      where: { id: providerTypeId },
      include: {
        requirements: {
          select: {
            id: true,
            name: true,
            description: true,
            validationType: true,
            isRequired: true,
            validationConfig: true,
            displayPriority: true,
          },
          orderBy: {
            displayPriority: 'asc',
          },
        },
      },
    });

    if (!providerType) {
      return NextResponse.json(
        { error: `Provider type with ID ${providerTypeId} not found` },
        { status: 404 }
      );
    }

    // If providerId is provided, fetch the provider's requirement submissions
    let requirementSubmissions = null;
    if (providerId) {
      const provider = await prisma.provider.findUnique({
        where: { id: providerId },
        include: {
          requirementSubmissions: {
            select: {
              requirementTypeId: true,
              documentMetadata: true,
              status: true,
            },
          },
        },
      });

      if (provider) {
        requirementSubmissions = provider.requirementSubmissions;
      }
    }

    // Map requirements and mark those that have been submitted
    const requirements = providerType.requirements.map((requirement, index) => {
      // Check if this requirement has been submitted by the provider
      const submission = requirementSubmissions?.find(
        (sub) => sub.requirementTypeId === requirement.id
      );

      return {
        ...requirement,
        index,
        // Map submission data to existingSubmission if available
        existingSubmission: submission
          ? {
              documentMetadata: submission.documentMetadata,
              status: submission.status,
            }
          : undefined,
      };
    });

    return NextResponse.json(requirements);
  } catch (error) {
    console.error('Error fetching requirement types:', error);
    return NextResponse.json({ error: 'Failed to fetch requirement types' }, { status: 500 });
  }
}
