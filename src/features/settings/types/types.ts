import { UserRole } from '@prisma/client';

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
