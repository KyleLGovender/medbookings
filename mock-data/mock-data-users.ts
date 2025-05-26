// Mock Users Data for Magic Patterns UI Development

// Define the UserRole enum values as they appear in the schema
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

// Updated mock users to match the User model in schema.prisma
export const mockUsers = [
  {
    id: 'user_1',
    name: 'Sarah Johnson',
    email: 'admin@healthclinic.com',
    emailVerified: '2024-01-14T09:00:00Z',
    phone: '+1234567890',
    phoneVerified: '2024-01-14T09:00:00Z',
    whatsapp: '+1234567890',
    whatsappVerified: null,
    password: 'hashed_password_1',
    image:
      'https://images.unsplash.com/photo-1494790108755-2616b332c?w=150&h=150&fit=crop&crop=face',
    role: UserRole.ADMIN,
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 'user_2',
    name: 'Dr. Michael Smith',
    email: 'dr.smith@medicalpro.com',
    emailVerified: '2024-01-09T10:00:00Z',
    phone: '+1234567891',
    phoneVerified: '2024-01-09T10:00:00Z',
    whatsapp: '+27123456789', // Matching the provider whatsapp
    whatsappVerified: '2024-01-09T10:00:00Z',
    password: 'hashed_password_2',
    image:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face',
    role: UserRole.USER, // Regular users can be service providers
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'user_3',
    name: 'Jane Doe',
    email: 'jane.doe@email.com',
    emailVerified: '2024-01-19T11:00:00Z',
    phone: '+1234567892',
    phoneVerified: '2024-01-19T11:00:00Z',
    whatsapp: null,
    whatsappVerified: null,
    password: 'hashed_password_3',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    role: UserRole.USER,
    createdAt: '2024-01-20T11:00:00Z',
    updatedAt: '2024-01-20T11:00:00Z',
  },
  {
    id: 'user_4',
    name: 'Dr. Emma Williams',
    email: 'dr.williams@therapycenter.com',
    emailVerified: '2024-01-11T08:00:00Z',
    phone: '+1234567893',
    phoneVerified: '2024-01-11T08:00:00Z',
    whatsapp: '+27987654321', // Matching the provider whatsapp
    whatsappVerified: '2024-01-11T08:00:00Z',
    password: 'hashed_password_4',
    image:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
    role: UserRole.USER, // Regular users can be service providers
    createdAt: '2024-01-12T08:00:00Z',
    updatedAt: '2024-01-12T08:00:00Z',
  },
  {
    id: 'user_5',
    name: 'Maria Garcia',
    email: 'receptionist@healthclinic.com',
    emailVerified: '2024-01-15T09:30:00Z',
    phone: '+1234567894',
    phoneVerified: '2024-01-15T09:30:00Z',
    whatsapp: null,
    whatsappVerified: null,
    password: 'hashed_password_5',
    image:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
    role: UserRole.USER,
    createdAt: '2024-01-16T09:30:00Z',
    updatedAt: '2024-01-16T09:30:00Z',
  },
  {
    id: 'user_6',
    name: 'Dr. James Chen',
    email: 'james.chen@dentalcare.co.za',
    emailVerified: '2024-01-13T09:30:00Z',
    phone: '+1234567895',
    phoneVerified: '2024-01-13T09:30:00Z',
    whatsapp: '+27456789123', // Matching the provider whatsapp
    whatsappVerified: '2024-01-13T09:30:00Z',
    password: 'hashed_password_6',
    image:
      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face',
    role: UserRole.USER,
    createdAt: '2024-01-14T09:30:00Z',
    updatedAt: '2024-01-14T09:30:00Z',
  },
] as const;
