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
        addressComponents: z.record(z.any()),
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
