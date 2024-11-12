import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const serviceProviderSchema = z.object({
  serviceProviderTypeId: z.string().min(1, 'Provider type is required'),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(500),
  image: z
    .custom<FileList>()
    .transform((files) => files?.[0])
    .pipe(
      z
        .object({
          size: z.number().max(MAX_FILE_SIZE, 'Max file size is 5MB'),
          type: z.enum(
            ACCEPTED_IMAGE_TYPES,
            'Only .jpg, .jpeg, .png and .webp formats are supported'
          ),
        })
        .optional()
    ),
  languages: z.array(z.string()).min(1, 'Select at least one language'),
  billingType: z.enum([
    'PRIVATE_ONLY',
    'MEDICAL_AID_ONLY',
    'MEDICAL_AID_AND_PRIVATE',
    'INSURANCE_ONLY',
    'ALL',
  ]),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  services: z.array(z.string()).min(1, 'Select at least one service'),
  requirements: z.array(
    z.object({
      requirementTypeId: z.string(),
      value: z.string().optional(),
      documentUrl: z.string().optional(),
    })
  ),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
});

export type ServiceProviderFormType = z.infer<typeof serviceProviderSchema>;
