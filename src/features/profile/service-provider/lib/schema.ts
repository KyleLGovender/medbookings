import { z } from 'zod';

import { BillingType } from '@prisma/client';

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
  name: z.string().min(1, "Name is required"),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(500),
  image: z.union([
    // For new file uploads
    typeof window === 'undefined' 
      ? z.any() // fallback for SSR
      : z.instanceof(FileList)
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
    z.string().url().nullable()
  ]).nullable(),
  languages: z.array(z.string()).min(1, 'Select at least one language'),
  billingType: z.nativeEnum(BillingType),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  services: z.array(z.string()).min(1, 'Select at least one service'),
  requirements: z.array(
    z.object({
      requirementTypeId: z.string(),
      value: z.string().optional(),
      documentUrl: z.string().optional(),
      otherValue: z.string().optional(),
    })
  ).optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
});

export type ServiceProviderFormType = z.infer<typeof serviceProviderSchema>;
