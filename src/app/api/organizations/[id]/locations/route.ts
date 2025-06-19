import { type NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { organizationLocationsSchema } from '@/features/organizations/types/types';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const userId = currentUser.id;

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: id },
      include: {
        memberships: {
          where: { userId },
          select: { role: true },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user is an admin of the organization
    const isAdmin = organization.memberships.some((m) => m.role === 'ADMIN');
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update this organization' },
        { status: 403 }
      );
    }

    // 2. Parse and Validate Request Body
    const body = await req.json();
    const validation = organizationLocationsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { locations: incomingLocations } = validation.data;

    // 3. Fetch Existing Locations to Compare
    const existingLocations = await prisma.location.findMany({
      where: { organizationId: id },
    });
    const existingLocationIds = new Set(existingLocations.map((loc) => loc.id));
    const incomingLocationIds = new Set(
      incomingLocations.filter((loc) => loc.id).map((loc) => loc.id!)
    );

    // 4. Determine which locations to Create, Update, and Delete
    const locationsToCreate = incomingLocations.filter((loc) => !loc.id);
    const locationsToUpdate = incomingLocations.filter(
      (loc) => loc.id && existingLocationIds.has(loc.id)
    );
    const locationIdsToDelete = Array.from(existingLocationIds).filter(
      (id) => !incomingLocationIds.has(id)
    );

    // 5. Perform all database operations in a single transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      // A) Delete locations that are no longer present
      if (locationIdsToDelete.length > 0) {
        await tx.location.deleteMany({
          where: { id: { in: locationIdsToDelete } },
        });
      }

      // B) Update existing locations
      for (const loc of locationsToUpdate) {
        await tx.location.update({
          where: { id: loc.id! },
          data: {
            name: loc.name,
            googlePlaceId: loc.googlePlaceId,
            formattedAddress: loc.formattedAddress,
            coordinates: loc.coordinates,
            searchTerms: loc.searchTerms,
            phone: loc.phone,
            email: loc.email,
          },
        });
      }

      // C) Create new locations
      if (locationsToCreate.length > 0) {
        await tx.location.createMany({
          data: locationsToCreate.map((loc) => ({
            organizationId: id,
            name: loc.name,
            googlePlaceId: loc.googlePlaceId,
            formattedAddress: loc.formattedAddress,
            coordinates: loc.coordinates,
            searchTerms: loc.searchTerms,
            phone: loc.phone,
            email: loc.email,
          })),
        });
      }

      // Return the final, updated list of locations for the organization
      return tx.location.findMany({ where: { organizationId: id } });
    });

    return NextResponse.json(transactionResult, { status: 200 });
  } catch (error) {
    console.error('Failed to update organization locations:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
