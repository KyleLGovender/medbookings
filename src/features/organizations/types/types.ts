import type {
  Organization,
  OrganizationProviderConnection,
  ProviderInvitation,
  ProviderInvitationStatus,
  User,
} from '@prisma/client';
import { z } from 'zod';

export const organizationRegistrationSchema = z.object({
  organization: z.object({
    name: z.string().min(1, 'Organization name is required'),
    description: z.string().optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
    logo: z.string().optional(), // URL to logo in Vercel Blob
    billingModel: z.enum(['CONSOLIDATED', 'PER_LOCATION', 'HYBRID']),
  }),
  locations: z
    .array(
      z.object({
        name: z.string().min(1, 'Location name is required'),
        googlePlaceId: z.string().min(1, 'Please select a location from Google Maps'),
        formattedAddress: z.string().min(1, 'Address is required'),
        coordinates: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        searchTerms: z.array(z.string()).optional(),
        phone: z.string().optional(),
        email: z.string().email('Invalid email address').optional().or(z.literal('')),
      })
    )
    .optional()
    .default([]),
});

export type OrganizationRegistrationData = z.infer<typeof organizationRegistrationSchema>;

/**
 * Schema for organization basic information updates
 */
export const organizationBasicInfoSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  description: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  logo: z.string().optional(), // URL to logo in Vercel Blob
});

export type OrganizationBasicInfoData = z.infer<typeof organizationBasicInfoSchema>;

export interface GooglePlaceResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  name?: string;
}

export const locationSchema = z.object({
  id: z.string().optional(), // Existing locations will have an ID
  name: z.string().min(1, 'Location name is required'),
  googlePlaceId: z.string().min(1, 'Please select a location from Google Maps'),
  formattedAddress: z.string().min(1, 'Address is required'),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  searchTerms: z.array(z.string()).optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

export const organizationLocationsSchema = z.object({
  locations: z.array(locationSchema).optional().default([]),
});

export type OrganizationLocationsData = z.infer<typeof organizationLocationsSchema>;

// Provider invitation schemas
export const ProviderInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  customMessage: z.string().optional(),
});

export type ProviderInvitationData = z.infer<typeof ProviderInvitationSchema>;

// Extended invitation type with relations
export type ProviderInvitationWithDetails = ProviderInvitation & {
  organization: Organization;
  invitedBy: User;
  connection?: OrganizationProviderConnection | null;
};

// Schema for managing invitations (cancel, resend)
export const InvitationActionSchema = z.object({
  action: z.enum(['cancel', 'resend']),
});

export type InvitationAction = z.infer<typeof InvitationActionSchema>;

// Export Prisma types for convenience
export type { ProviderInvitation, ProviderInvitationStatus };
