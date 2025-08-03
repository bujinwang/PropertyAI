import { UserRole } from '@prisma/client';

interface UserSeed {
  id?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive?: boolean;
}

export const users: UserSeed[] = [
  // Admin user
  {
    email: 'admin@propertyai.com',
    password: 'Password123!',
    firstName: 'Admin',
    lastName: 'User',
    phone: '555-123-4567',
    role: UserRole.ADMIN,
  },
  
  // Property Managers
  {
    email: 'sarah.manager@propertyai.com',
    password: 'Password123!',
    firstName: 'Sarah',
    lastName: 'Johnson',
    phone: '555-234-5678',
    role: UserRole.PROPERTY_MANAGER,
  },
  {
    email: 'michael.manager@propertyai.com',
    password: 'Password123!',
    firstName: 'Michael',
    lastName: 'Thompson',
    phone: '555-345-6789',
    role: UserRole.PROPERTY_MANAGER,
  },
  
  // Vendors/Contractors
  {
    email: 'contractor@propertyai.com',
    password: 'Password123!',
    firstName: 'John',
    lastName: 'Contractor',
    phone: '555-111-2222',
    role: UserRole.VENDOR,
  },
  {
    email: 'plumber@propertyai.com',
    password: 'Password123!',
    firstName: 'Mike',
    lastName: 'Plumber',
    phone: '555-222-3333',
    role: UserRole.VENDOR,
  },
  {
    email: 'electrician@propertyai.com',
    password: 'Password123!',
    firstName: 'Sarah',
    lastName: 'Electrician',
    phone: '555-333-4444',
    role: UserRole.VENDOR,
  },
  
  // Tenants
  {
    email: 'john.tenant@example.com',
    password: 'Password123!',
    firstName: 'John',
    lastName: 'Smith',
    phone: '555-456-7890',
    role: UserRole.TENANT,
  },
  {
    email: 'emma.tenant@example.com',
    password: 'Password123!',
    firstName: 'Emma',
    lastName: 'Davis',
    phone: '555-567-8901',
    role: UserRole.TENANT,
  },
  {
    email: 'david.tenant@example.com',
    password: 'Password123!',
    firstName: 'David',
    lastName: 'Wilson',
    phone: '555-678-9012',
    role: UserRole.TENANT,
  },
  {
    email: 'lisa.tenant@example.com',
    password: 'Password123!',
    firstName: 'Lisa',
    lastName: 'Brown',
    phone: '555-789-0123',
    role: UserRole.TENANT,
  },
  {
    email: 'james.tenant@example.com',
    password: 'Password123!',
    firstName: 'James',
    lastName: 'Miller',
    phone: '555-890-1234',
    role: UserRole.TENANT,
  },
  {
    email: 'olivia.tenant@example.com',
    password: 'Password123!',
    firstName: 'Olivia',
    lastName: 'Martinez',
    phone: '555-901-2345',
    role: UserRole.TENANT,
  },
  {
    email: 'inactive.tenant@example.com',
    password: 'Password123!',
    firstName: 'Inactive',
    lastName: 'User',
    phone: '555-012-3456',
    role: UserRole.TENANT,
    isActive: false,
  },
];