/**
 * Password validation utilities
 *
 * Provides consistent password complexity requirements across the application.
 * Requirements align with OWASP and industry security standards.
 */
import { z } from 'zod';

/**
 * Password complexity requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 *
 * Security rationale:
 * - Prevents common weak passwords
 * - Increases entropy and brute-force resistance
 * - Meets POPIA security safeguards requirements
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Password requirements for display in UI
 */
export const PASSWORD_REQUIREMENTS = [
  'At least 8 characters',
  'At least one uppercase letter (A-Z)',
  'At least one lowercase letter (a-z)',
  'At least one number (0-9)',
  'At least one special character (!@#$%^&*)',
] as const;

/**
 * Validate password strength
 * Returns validation result with detailed error messages
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const result = passwordSchema.safeParse(password);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: result.error.errors.map((err) => err.message),
  };
}

/**
 * Check individual password requirements
 * Useful for real-time validation feedback in UI
 */
export function checkPasswordRequirements(password: string): {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
} {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}
