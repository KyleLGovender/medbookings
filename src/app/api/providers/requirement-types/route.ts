import { NextRequest, NextResponse } from 'next/server';

import { RequirementType, RequirementsValidationStatus } from '@/features/providers/types/types';
import { prisma } from '@/lib/prisma';

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
    const url = new URL(request.url);
    const providerTypeId = url.searchParams.get('providerTypeId');
    const providerId = url.searchParams.get('providerId');

    // If no providerTypeId is provided, return an error
    if (!providerTypeId) {
      return NextResponse.json({ error: 'Provider type ID is required' }, { status: 400 });
    }

    // Fetch the provider type with its requirements
    const providerType = await prisma.serviceProviderType.findUnique({
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
          orderBy: [{ displayPriority: 'asc' }, { name: 'asc' }],
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
      const provider = await prisma.serviceProvider.findUnique({
        where: { id: providerId },
        include: {
          requirementSubmissions: {
            select: {
              requirementTypeId: true,
              documentUrl: true,
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
    const requirements = providerType.requirements.map((requirement, index): RequirementType => {
      // Check if this requirement has been submitted by the provider
      const submission = requirementSubmissions?.find(
        (sub) => sub.requirementTypeId === requirement.id
      );

      // Transform the requirement to match the RequirementType interface
      return {
        id: requirement.id,
        name: requirement.name,
        description: requirement.description,
        validationType: requirement.validationType,
        isRequired: requirement.isRequired,
        validationConfig: requirement.validationConfig as any, // Cast to ValidationConfig
        displayPriority: requirement.displayPriority || 0,
        index,
        // Map submission data to existingSubmission if available
        existingSubmission: submission
          ? {
              documentUrl: submission.documentUrl,
              documentMetadata: submission.documentMetadata as any,
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
