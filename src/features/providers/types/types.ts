import { z } from 'zod';

export type Service = z.infer<typeof ServiceSchema>;

// Define a more specific type for the user property
export type ServiceProviderUser = {
  email: string | null;
};

// Define a more specific type for the serviceProviderType property
export type ServiceProviderType = {
  name: string;
  description: string | null;
};

export type ServiceProvider = Omit<
  z.infer<typeof ServiceProviderSchema>,
  'createdAt' | 'updatedAt' | 'verifiedAt' | 'trialStarted' | 'trialEnded'
> & {
  services: Array<
    Omit<Service, 'createdAt' | 'updatedAt' | 'defaultPrice' | 'defaultDuration'> & {
      defaultPrice: number | null;
      defaultDuration: number | null;
      createdAt: string;
      updatedAt: string;
    }
  >;
  user: ServiceProviderUser;
  serviceProviderType: ServiceProviderType;
  whatsapp: string | null;
  createdAt: string;
  updatedAt: string;
  verifiedAt: string | null;
  trialStarted: string | null;
  trialEnded: string | null;
  calendarIntegration?: {
    id: string;
    provider: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    calendarId: string | null;
    syncEnabled: boolean;
    lastSyncedAt: string | null;
    googleEmail: string | null;
    grantedScopes: string[];
    meetSettings: any | null;
  } | null;
  requirementSubmissions?: Array<{
    requirementTypeId: string;
    documentUrl: string | null;
    documentMetadata: { value?: string } | null;
    createdAt: string;
    updatedAt: string;
    validatedAt: string | null;
    expiresAt: string | null;
    requirementType: {
      id: string;
      name: string;
      description: string | null;
      createdAt: string;
      updatedAt: string;
      validationConfig: any | null;
    };
  }>;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

type RequirementField = {
  value: string;
  requirementTypeId: number;
  documentUrl?: string;
  otherValue?: string;
};

export const serviceProviderSchema = z.object({
  userId: z.string(),
  serviceProviderTypeId: z.string().min(1, 'Provider type is required'),
  name: z.string().min(1, 'Name is required'),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(500),
  image: z
    .union([
      // For new file uploads
      typeof window === 'undefined'
        ? z.any() // fallback for SSR
        : z
            .instanceof(FileList)
            .transform((fileList) => fileList.item(0))
            .refine((file) => file !== null, {
              message: 'Image is required',
            })
            .refine((file) => file && file.size <= MAX_FILE_SIZE, {
              message: 'Max file size is 5MB',
            })
            .refine((file) => file && ACCEPTED_IMAGE_TYPES.includes(file.type), {
              message: 'Only .jpg, .jpeg, .png and .webp formats are supported',
            }),
      // For existing images (string URL) or no image (null)
      z.string().url().nullable(),
    ])
    .nullable(),
  languages: z.array(z.string()).min(1, 'Select at least one language'),
  email: z.string().email('Please enter a valid email').min(1, 'Email is required'),
  whatsapp: z.string().min(1, 'WhatsApp number is required'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  services: z.array(z.string()).min(1, 'Select at least one service'),
  requirements: z
    .array(
      z.object({
        requirementTypeId: z.string(),
        value: z.string().optional(),
        documentUrl: z.string().optional(),
        otherValue: z.string().optional(),
        documentFile: z.instanceof(File).optional(),
      })
    )
    .optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
});

export type ServiceProviderFormType = z.infer<typeof serviceProviderSchema>;

export interface MeetSettings {
  requireAuthentication: boolean;
  allowExternalGuests: boolean;
  defaultConferenceSolution: 'google_meet';
}
