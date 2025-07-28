/**
 * Organization member management page
 *
 * Interface for managing organization members, invitations,
 * and role assignments with proper permission controls.
 */
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/features/auth/lib/session-helper';
import { MemberInvitationForm } from '@/features/organizations/components/member-invitation-form';
import { hasPermission } from '@/lib/auth/permissions';
import { prisma } from '@/lib/prisma';
import { Permission } from '@/types/permissions';

interface MemberManagementPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: MemberManagementPageProps): Promise<Metadata> {
  const organization = await prisma.organization.findUnique({
    where: { id: params.id },
    select: { name: true },
  });

  return {
    title: `Members - ${organization?.name || 'Organization'} | MedBookings`,
    description: 'Manage organization members and invitations',
  };
}

async function getOrganizationMemberData(organizationId: string) {
  // Get organization with members and pending invitations
  const [organization, members, pendingInvitations] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    }),

    prisma.organizationMembership.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, etc.
        { createdAt: 'asc' },
      ],
    }),

    prisma.organizationInvitation.findMany({
      where: {
        organizationId,
        status: 'PENDING',
      },
      include: {
        invitedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!organization) {
    return null;
  }

  // Transform data for component
  const transformedMembers = members.map((member) => ({
    id: member.id,
    email: member.user.email || 'No email',
    name: member.user.name || 'No name',
    role: member.role as any,
    joinedAt: member.createdAt,
  }));

  const transformedInvitations = pendingInvitations.map((invitation) => ({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role as any,
    sentAt: invitation.createdAt,
    expiresAt: invitation.expiresAt,
    invitedBy: invitation.invitedBy.name || 'Unknown',
  }));

  return {
    organization,
    members: transformedMembers,
    pendingInvitations: transformedInvitations,
  };
}

export default async function MemberManagementPage({ params }: MemberManagementPageProps) {
  const currentUser = await getCurrentUser();

  // Check authentication
  if (!currentUser) {
    redirect('/login');
  }

  // Check permission to view organization members
  const canViewMembers = hasPermission(currentUser.permissions, Permission.VIEW_ORGANIZATION, {
    organizationId: params.id,
  });

  if (!canViewMembers) {
    redirect('/unauthorized');
  }

  // Load organization and member data
  const data = await getOrganizationMemberData(params.id);

  if (!data) {
    redirect('/organizations');
  }

  const { organization, members, pendingInvitations } = data;

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{organization.name} Members</h1>
          <p className="text-muted-foreground">Manage organization members and invitations</p>
        </div>

        <MemberInvitationForm
          organizationId={organization.id}
          organizationName={organization.name}
          members={members}
          pendingInvitations={pendingInvitations}
        />
      </div>
    </div>
  );
}
