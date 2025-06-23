'use server';

import { revalidatePath } from 'next/cache';

import { OrganizationStatus } from '@prisma/client';

import {
  approveOrganization,
  getAdminOrganization,
  getAdminOrganizations,
  rejectOrganization,
} from './actions/administer-organization';

/**
 * Server action to approve an organization
 * @param organizationId The ID of the organization to approve
 * @returns Success or error result
 */
export async function approveOrganizationAction(organizationId: string) {
  const result = await approveOrganization(organizationId);

  if (result.success) {
    // Revalidate admin organization pages
    revalidatePath('/admin/organizations');
    revalidatePath(`/admin/organizations/${organizationId}`);
  }

  return result;
}

/**
 * Server action to reject an organization
 * @param organizationId The ID of the organization to reject
 * @param rejectionReason The reason for rejection
 * @returns Success or error result
 */
export async function rejectOrganizationAction(organizationId: string, rejectionReason: string) {
  const result = await rejectOrganization(organizationId, rejectionReason);

  if (result.success) {
    // Revalidate admin organization pages
    revalidatePath('/admin/organizations');
    revalidatePath(`/admin/organizations/${organizationId}`);
  }

  return result;
}

/**
 * Server action to fetch all organizations for admin view
 * @param status Optional status filter
 * @returns Success or error result with organizations
 */
export async function getAdminOrganizationsAction(status?: OrganizationStatus) {
  return await getAdminOrganizations(status);
}

/**
 * Server action to fetch a specific organization for admin view
 * @param organizationId The ID of the organization to fetch
 * @returns Success or error result with organization details
 */
export async function getAdminOrganizationAction(organizationId: string) {
  return await getAdminOrganization(organizationId);
}
