/**
 * Password Hashing Utilities
 *
 * Centralized password hashing using bcrypt with automatic SHA-256 migration.
 *
 * Security Features:
 * - bcrypt with salt (automatic per-password salt)
 * - Work factor 12 (OWASP recommended)
 * - Hybrid verification for gradual migration from SHA-256
 * - Future-proof (work factor can be increased)
 *
 * POPIA Compliance: Section 19 - Security safeguards requirement
 */
import bcrypt from 'bcryptjs';

import { logger } from '@/lib/logger';

/**
 * bcrypt work factor (cost)
 * - 12 = OWASP recommended (2024)
 * - Each increment doubles the work
 * - ~250ms on modern hardware
 * - Can be increased in future for better security
 */
const BCRYPT_ROUNDS = 12;

/**
 * Hash password using bcrypt with automatic salting
 *
 * @param password - Plain text password to hash
 * @returns Promise resolving to bcrypt hash string
 *
 * @example
 * const hash = await hashPassword('MySecureP@ssw0rd');
 * // Returns: $2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify password against bcrypt hash
 *
 * @param password - Plain text password to verify
 * @param hash - bcrypt hash to compare against
 * @returns Promise resolving to true if password matches
 *
 * @example
 * const isValid = await verifyPassword('MySecureP@ssw0rd', storedHash);
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    // bcrypt.compare can throw if hash format is invalid
    logger.warn('bcrypt verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Legacy SHA-256 verification (for migration only)
 *
 * DEPRECATED: Only used for migrating existing users from SHA-256 to bcrypt.
 * Will be removed after migration is complete (~3 months).
 *
 * @param password - Plain text password
 * @param hash - SHA-256 hash (64 hex characters)
 * @returns Promise resolving to true if SHA-256 matches
 *
 * @internal
 */
async function verifyLegacySHA256(password: string, hash: string): Promise<boolean> {
  try {
    const crypto = await import('crypto');
    const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
    return sha256Hash === hash;
  } catch (error) {
    logger.error('SHA-256 verification error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Hybrid password verification with automatic migration detection
 *
 * Tries bcrypt first (for already migrated users), then falls back to
 * SHA-256 (for unmigrated users). Callers should rehash to bcrypt when
 * needsMigration is true.
 *
 * @param password - Plain text password to verify
 * @param storedHash - Hash from database (bcrypt or SHA-256)
 * @returns Object indicating validity and whether migration is needed
 *
 * @example
 * const { isValid, needsMigration } = await verifyPasswordWithMigration(
 *   credentials.password,
 *   user.password
 * );
 *
 * if (isValid && needsMigration) {
 *   // Rehash to bcrypt and update database
 *   const newHash = await hashPassword(credentials.password);
 *   await updateUserPassword(user.id, newHash);
 * }
 */
export async function verifyPasswordWithMigration(
  password: string,
  storedHash: string
): Promise<{
  isValid: boolean;
  needsMigration: boolean;
}> {
  // Try bcrypt first (already migrated users)
  // bcrypt hashes start with $2a$, $2b$, or $2y$
  if (storedHash.startsWith('$2')) {
    const isBcryptValid = await verifyPassword(password, storedHash);
    if (isBcryptValid) {
      return { isValid: true, needsMigration: false };
    }
    // If bcrypt verification fails, password is wrong (don't try SHA-256)
    return { isValid: false, needsMigration: false };
  }

  // SHA-256 hashes are 64 hex characters
  if (storedHash.length === 64 && /^[a-f0-9]+$/i.test(storedHash)) {
    const isSHA256Valid = await verifyLegacySHA256(password, storedHash);
    if (isSHA256Valid) {
      logger.info('User authenticated with legacy SHA-256 hash - migration needed');
      return { isValid: true, needsMigration: true };
    }
  }

  // Neither bcrypt nor SHA-256 matched
  return { isValid: false, needsMigration: false };
}

/**
 * Check if a hash is in bcrypt format
 *
 * @param hash - Hash string to check
 * @returns True if hash is in bcrypt format
 *
 * @example
 * isBcryptHash('$2a$12$R9h/cIPz0gi.URNNX3kh2O...') // true
 * isBcryptHash('5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8') // false
 */
export function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2');
}

/**
 * Check if a hash is in SHA-256 format
 *
 * @param hash - Hash string to check
 * @returns True if hash appears to be SHA-256 (64 hex chars)
 *
 * @example
 * isSHA256Hash('5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8') // true
 * isSHA256Hash('$2a$12$R9h/cIPz0gi.URNNX3kh2O...') // false
 */
export function isSHA256Hash(hash: string): boolean {
  return hash.length === 64 && /^[a-f0-9]+$/i.test(hash);
}
