import { OrganizationBillingModel } from '@prisma/client';

import { OrganizationRegistrationData } from '@/features/organizations/types/types';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Creates a new organization with locations based on registration data
 * @param data Organization registration data
 * @returns The created organization
 */
export async function registerOrganization(data: OrganizationRegistrationData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.id) {
    throw new Error('User not authenticated');
  }

  // Create organization transaction to ensure data consistency
  const organization = await prisma.$transaction(async (tx) => {
    // Create the organization
    const org = await tx.organization.create({
      data: {
        name: data.organization.name,
        description: data.organization.description || '',
        email: data.organization.email || '',
        phone: data.organization.phone || '',
        website: data.organization.website || '',
        logo: data.organization.logo || '',
        billingModel: data.organization.billingModel as OrganizationBillingModel,
        // Connect the current user as an admin via memberships
        memberships: {
          create: {
            userId: currentUser.id,
            role: 'ADMIN',
            permissions: [
              'MANAGE_PROVIDERS',
              'MANAGE_BOOKINGS',
              'MANAGE_LOCATIONS',
              'MANAGE_STAFF',
              'VIEW_ANALYTICS',
              'MANAGE_BILLING',
            ],
            status: 'ACTIVE',
          },
        },
      },
    });

    // Create locations if provided
    if (data.locations && data.locations.length > 0) {
      for (const location of data.locations) {
        await tx.location.create({
          data: {
            name: location.name,
            googlePlaceId: location.googlePlaceId,
            formattedAddress: location.formattedAddress,
            coordinates: {
              create: {
                latitude: location.coordinates.lat,
                longitude: location.coordinates.lng,
              },
            },
            addressComponents: location.addressComponents,
            city: location.city,
            country: location.country,
            phone: location.phone || '',
            email: location.email || '',
            organizationId: org.id,
          },
        });
      }
    }

    return org;
  });

  return organization;
}

/**
 * Checks if a user is already associated with an organization
 * @param userId User ID to check
 * @returns Boolean indicating if user has an organization
 */
export async function checkUserHasOrganization(userId: string) {
  const organizationMembership = await prisma.organizationMembership.findFirst({
    where: { userId },
  });

  return !!organizationMembership;
}
