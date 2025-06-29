import type {
  ConnectionStatus,
  Organization,
  OrganizationProviderConnection,
  ProviderInvitation,
  ProviderInvitationStatus,
  ServiceProvider,
} from '@prisma/client';
import { z } from 'zod';

// Provider invitation types
export type ProviderInvitationWithOrganization = ProviderInvitation & {
  organization: Organization;
  invitedBy?: {
    name: string | null;
    email: string;
  } | null;
  connection?: {
    id: string;
    status: ConnectionStatus;
    acceptedAt: Date | null;
  } | null;
};

export type OrganizationConnectionWithDetails = OrganizationProviderConnection & {
  organization: Organization;
  invitation?: {
    id: string;
    customMessage: string | null;
    createdAt: Date;
    invitedBy: {
      name: string | null;
      email: string;
    } | null;
  } | null;
};

// Schema for accepting/rejecting invitations
export const InvitationResponseSchema = z.object({
  action: z.enum(['accept', 'reject']),
  rejectionReason: z.string().optional(),
});

export type InvitationResponse = z.infer<typeof InvitationResponseSchema>;

// Schema for connection management
export const ConnectionUpdateSchema = z.object({
  status: z.enum(['ACCEPTED', 'SUSPENDED'] as const),
});

export type ConnectionUpdate = z.infer<typeof ConnectionUpdateSchema>;

// Export Prisma types for convenience
export type {
  ProviderInvitation,
  ProviderInvitationStatus,
  OrganizationProviderConnection,
  ConnectionStatus,
};

// Types are already exported above, no need to re-export
