'use server';

import { revalidatePath } from 'next/cache';

import {
  approveRequirement,
  approveServiceProvider,
  checkAllRequiredRequirementsApproved,
  getProviderRequirementSubmissions,
  rejectRequirement,
  rejectServiceProvider,
} from './actions/administer-provider';

// Server action for approving a requirement
export async function approveRequirementAction(
  requirementSubmissionId: string,
  adminNotes?: string
) {
  const result = await approveRequirement(requirementSubmissionId, adminNotes);

  if (result.success) {
    // Revalidate relevant paths
    revalidatePath('/admin/providers');
    revalidatePath(`/admin/providers/${result.data?.serviceProviderId}`);
  }

  return result;
}

// Server action for rejecting a requirement
export async function rejectRequirementAction(
  requirementSubmissionId: string,
  rejectionReason: string
) {
  const result = await rejectRequirement(requirementSubmissionId, rejectionReason);

  if (result.success) {
    // Revalidate relevant paths
    revalidatePath('/admin/providers');
    revalidatePath(`/admin/providers/${result.data?.serviceProviderId}`);
  }

  return result;
}

// Server action for checking if all required requirements are approved
export async function checkAllRequiredRequirementsApprovedAction(serviceProviderId: string) {
  return await checkAllRequiredRequirementsApproved(serviceProviderId);
}

// Server action for getting provider requirement submissions
export async function getProviderRequirementSubmissionsAction(serviceProviderId: string) {
  return await getProviderRequirementSubmissions(serviceProviderId);
}

// Server action for approving a service provider
export async function approveServiceProviderAction(serviceProviderId: string) {
  const result = await approveServiceProvider(serviceProviderId);

  if (result.success) {
    // Revalidate relevant paths
    revalidatePath('/admin/providers');
    revalidatePath(`/admin/providers/${serviceProviderId}`);
  }

  return result;
}

// Server action for rejecting a service provider
export async function rejectServiceProviderAction(
  serviceProviderId: string,
  rejectionReason: string
) {
  const result = await rejectServiceProvider(serviceProviderId, rejectionReason);

  if (result.success) {
    // Revalidate relevant paths
    revalidatePath('/admin/providers');
    revalidatePath(`/admin/providers/${serviceProviderId}`);
  }

  return result;
}
