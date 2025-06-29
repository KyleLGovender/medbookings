import { z } from 'zod'
import type { 
  ProviderInvitation, 
  ProviderInvitationStatus,
  OrganizationProviderConnection,
  ConnectionStatus,
  Organization,
  ServiceProvider
} from '@prisma/client'

// Provider invitation types
export type ProviderInvitationWithOrganization = ProviderInvitation & {
  organization: Organization
}

export type OrganizationConnectionWithDetails = OrganizationProviderConnection & {
  organization: Organization
  invitation?: ProviderInvitation | null
}

// Schema for accepting/rejecting invitations
export const InvitationResponseSchema = z.object({
  action: z.enum(['accept', 'reject']),
  rejectionReason: z.string().optional(),
})

export type InvitationResponse = z.infer<typeof InvitationResponseSchema>

// Schema for connection management
export const ConnectionUpdateSchema = z.object({
  status: z.enum(['ACCEPTED', 'SUSPENDED'] as const),
})

export type ConnectionUpdate = z.infer<typeof ConnectionUpdateSchema>

// Export Prisma types for convenience
export type {
  ProviderInvitation,
  ProviderInvitationStatus,
  OrganizationProviderConnection,
  ConnectionStatus,
}

// Export all types for external use
export type {
  ProviderInvitationWithOrganization,
  OrganizationConnectionWithDetails,
  InvitationResponse,
  ConnectionUpdate,
}