'use server';

import { revalidatePath } from 'next/cache';

import {
  approveRequirement,
  approveProvider,
  checkAllRequiredRequirementsApproved,
  getProviderRequirementSubmissions,
  rejectRequirement,
  rejectProvider,
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
    revalidatePath(`/admin/providers/${result.data?.providerId}`);
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
    revalidatePath(`/admin/providers/${result.data?.providerId}`);
  }

  return result;
}

// Server action for checking if all required requirements are approved
export async function checkAllRequiredRequirementsApprovedAction(providerId: string) {
  return await checkAllRequiredRequirementsApproved(providerId);
}

// Server action for getting provider requirement submissions
export async function getProviderRequirementSubmissionsAction(providerId: string) {
  return await getProviderRequirementSubmissions(providerId);
}

// Server action for approving a provider
export async function approveProviderAction(providerId: string) {
  const result = await approveProvider(providerId);

  if (result.success) {
    // Revalidate relevant paths
    revalidatePath('/admin/providers');
    revalidatePath(`/admin/providers/${providerId}`);
  }

  return result;
}

// Server action for rejecting a provider
export async function rejectProviderAction(
  providerId: string,
  rejectionReason: string
) {
  const result = await rejectProvider(providerId, rejectionReason);

  if (result.success) {
    // Revalidate relevant paths
    revalidatePath('/admin/providers');
    revalidatePath(`/admin/providers/${providerId}`);
  }

  return result;
}

// Backward compatibility exports
export const approveServiceProviderAction = approveProviderAction;
export const rejectServiceProviderAction = rejectProviderAction;
