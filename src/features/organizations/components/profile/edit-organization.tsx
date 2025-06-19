'use client';

import { OrganizationProfileSkeleton } from '@/components/skeletons/organization-profile-skeleton';
import { EditOrganizationBasicInfo } from '@/features/organizations/components/profile/edit-organization-basic-info';
import { EditOrganizationBilling } from '@/features/organizations/components/profile/edit-organization-billing';
import { EditOrganizationLocations } from '@/features/organizations/components/profile/edit-organization-locations';
import { useOrganization } from '@/features/organizations/hooks/use-organization';

interface EditOrganizationProps {
  organizationId: string;
  userId?: string;
}

export function EditOrganization({ organizationId, userId }: EditOrganizationProps) {
  const { data: organization, isLoading } = useOrganization(organizationId);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <OrganizationProfileSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <EditOrganizationBasicInfo organizationId={organizationId} userId={userId} />
      <EditOrganizationBilling organizationId={organizationId} userId={userId} />
      <EditOrganizationLocations organizationId={organizationId} userId={userId} />
    </div>
  );
}
