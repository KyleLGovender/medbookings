import { z } from 'zod';

// Account Settings Schema
export const accountSettingsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
});

// Communication Preferences Schema
export const communicationPreferencesSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
  whatsapp: z.boolean().default(false),
  phoneNumber: z.string().optional(),
  whatsappNumber: z.string().optional(),
  reminderHours: z.number().int().min(1).max(168).default(24), // 1 hour to 1 week
});

// Provider Business Settings Schema
export const providerBusinessSettingsSchema = z.object({
  bio: z.string().max(1000, 'Bio must be less than 1000 characters').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  showPrice: z.boolean().default(true),
  languages: z.array(z.string()).min(1, 'At least one language is required'),
});

// Password Change Schema
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    // eslint-disable-next-line quotes
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type AccountSettingsInput = z.infer<typeof accountSettingsSchema>;
export type CommunicationPreferencesInput = z.infer<typeof communicationPreferencesSchema>;
export type ProviderBusinessSettingsInput = z.infer<typeof providerBusinessSettingsSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
