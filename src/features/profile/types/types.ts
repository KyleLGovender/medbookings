export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone: string | null;
  whatsapp: string | null;
  role: UserRole;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  error?: string;
  user?: UserProfile;
}

export interface DeleteAccountResponse {
  success: boolean;
  error?: string;
}
