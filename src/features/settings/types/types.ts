/**
 * =============================================================================
 * SETTINGS FEATURE TYPES
 * =============================================================================
 * Type definitions for user settings and preferences management
 */
import { UserRole } from '@prisma/client';

/**
 * User account settings and profile information
 * Contains core user data displayed in settings pages
 *
 * @property {string} id - Unique user identifier
 * @property {string} name - User full name
 * @property {string} email - User email address
 * @property {string} phone - User phone number
 * @property {string} whatsapp - User WhatsApp number
 * @property {UserRole} role - User account role
 * @property {Date} emailVerified - Email verification timestamp
 * @property {Date} phoneVerified - Phone verification timestamp
 * @property {Date} whatsappVerified - WhatsApp verification timestamp
 */
export interface UserSettings {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  role: UserRole;
  emailVerified: Date | null;
  phoneVerified: Date | null;
  whatsappVerified: Date | null;
}

/**
 * User communication preferences and notification settings
 * Controls how and when users receive notifications (email, SMS, WhatsApp)
 *
 * @property {string} id - Unique preferences identifier
 * @property {string} userId - User these preferences belong to
 * @property {boolean} email - Email notifications enabled
 * @property {boolean} sms - SMS notifications enabled
 * @property {boolean} whatsapp - WhatsApp notifications enabled
 * @property {string} phoneNumber - Phone number for SMS notifications
 * @property {string} whatsappNumber - WhatsApp number for notifications
 * @property {number} reminderHours - Hours before appointment to send reminder
 */
export interface CommunicationPreferences {
  id: string;
  userId: string;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  reminderHours: number;
}

/**
 * Provider business information for settings pages
 * Contains provider-specific profile data and display preferences
 *
 * @property {string} id - Unique provider identifier
 * @property {string} name - Provider business name
 * @property {string} bio - Provider biography/description
 * @property {string} website - Provider website URL
 * @property {boolean} showPrice - Whether to display prices publicly
 * @property {string[]} languages - Languages spoken by provider
 * @property {string} status - Provider account status
 */
export interface ProviderBusinessInfo {
  id: string;
  name: string;
  bio: string | null;
  website: string | null;
  showPrice: boolean;
  languages: string[];
  status: string;
}

export interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  visible: boolean;
}

export interface SettingsPageProps {
  user: UserSettings;
  provider?: ProviderBusinessInfo;
  communicationPreferences?: CommunicationPreferences;
  isProvider: boolean;
  isAdmin: boolean;
}
