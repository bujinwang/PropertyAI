import { PropertyType } from '@prisma/client';

interface PropertySeed {
  id?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  description?: string;
  propertyType: PropertyType;
  yearBuilt?: number;
  totalUnits: number;
  amenities?: any;
  isActive?: boolean;
  managerId: string;
  ownerId: string;
  latitude?: number;
  longitude?: number;
}

// User IDs - These would match the IDs generated for users
// Typically you'd query the database for these IDs after creating users
// For simplicity in seeding, we're hardcoding these values
const MANAGER1_ID = '2'; // Sarah Johnson
const MANAGER2_ID = '3'; // Michael Thompson
const ADMIN_ID = '1'; // Admin User (as an owner)

export const properties: PropertySeed[] = [
  // Apartment Complex
  {
    name: 'Sunrise Apartments',
    address: '1234 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    country: 'USA',
    description: 'Modern apartment complex in the heart of San Francisco with stunning bay views and premium amenities.',
    propertyType: PropertyType.APARTMENT,
    yearBuilt: 2010,
    totalUnits: 24,
    amenities: {
      hasPool: true,
      hasGym: true,
      hasParkingGarage: true,
      isPetFriendly: true,
      hasElevator: true,
      hasRooftopDeck: true,
      securityFeatures: ['24/7 Security', 'Key Card Access', 'Security Cameras'],
      communityFeatures: ['Community Room', 'Business Center', 'Courtyard']
    },
    managerId: MANAGER1_ID,
    ownerId: ADMIN_ID,
    latitude: 37.7749,
    longitude: -122.4194,
  },
  
  // Townhouse Community
  {
    name: 'Parkview Townhomes',
    address: '5678 Park Avenue',
    city: 'San Jose',
    state: 'CA',
    zipCode: '95110',
    country: 'USA',
    description: 'Spacious townhomes adjacent to Central Park with modern finishes and private patios.',
    propertyType: PropertyType.TOWNHOUSE,
    yearBuilt: 2015,
    totalUnits: 12,
    amenities: {
      hasPool: true,
      hasGym: false,
      hasParkingGarage: true,
      isPetFriendly: true,
      hasElevator: false,
      securityFeatures: ['Gated Community', 'Security Cameras'],
      communityFeatures: ['Playground', 'Walking Trails', 'Dog Park']
    },
    managerId: MANAGER1_ID,
    ownerId: ADMIN_ID,
    latitude: 37.3382,
    longitude: -121.8863,
  },
  
  // Single Family Home
  {
    name: 'Oakridge House',
    address: '910 Oak Lane',
    city: 'Palo Alto',
    state: 'CA',
    zipCode: '94301',
    country: 'USA',
    description: 'Charming single-family home in a quiet neighborhood with a large backyard and renovated interior.',
    propertyType: PropertyType.HOUSE,
    yearBuilt: 1985,
    totalUnits: 1,
    amenities: {
      hasPool: false,
      hasGarage: true,
      hasBackyard: true,
      hasDeck: true,
      isPetFriendly: true,
      securityFeatures: ['Alarm System'],
      specialFeatures: ['Recently Renovated Kitchen', 'Hardwood Floors', 'Solar Panels']
    },
    managerId: MANAGER2_ID,
    ownerId: ADMIN_ID,
    latitude: 37.4419,
    longitude: -122.1430,
  },
  
  // Condominium Building
  {
    name: 'Bayview Condos',
    address: '123 Waterfront Drive',
    city: 'Oakland',
    state: 'CA',
    zipCode: '94607',
    country: 'USA',
    description: 'Luxury condominiums with waterfront views, high-end finishes, and resort-style amenities.',
    propertyType: PropertyType.CONDO,
    yearBuilt: 2018,
    totalUnits: 36,
    amenities: {
      hasPool: true,
      hasGym: true,
      hasSpa: true,
      hasParkingGarage: true,
      isPetFriendly: false,
      hasElevator: true,
      hasRooftopDeck: true,
      hasBalcony: true,
      securityFeatures: ['24/7 Concierge', 'Key Card Access', 'Security Cameras'],
      communityFeatures: ['Wine Cellar', 'Conference Room', 'Party Room', 'Guest Suites']
    },
    managerId: MANAGER2_ID,
    ownerId: ADMIN_ID,
    latitude: 37.8044,
    longitude: -122.2711,
  },
  
  // Commercial Property
  {
    name: 'Tech Plaza',
    address: '456 Innovation Way',
    city: 'Mountain View',
    state: 'CA',
    zipCode: '94043',
    country: 'USA',
    description: 'Modern office complex designed for tech companies with flexible workspaces and cutting-edge amenities.',
    propertyType: PropertyType.COMMERCIAL,
    yearBuilt: 2019,
    totalUnits: 15,
    amenities: {
      hasConferenceRooms: true,
      hasHighSpeedInternet: true,
      hasCafeteria: true,
      hasParking: true,
      hasShowers: true,
      hasBikeStorage: true,
      securityFeatures: ['24/7 Security', 'Key Card Access', 'Security Cameras'],
      officeFeatures: ['Open Floor Plans', 'Private Offices', 'Phone Booths', 'Break Rooms']
    },
    managerId: MANAGER1_ID,
    ownerId: ADMIN_ID,
    latitude: 37.3861,
    longitude: -122.0839,
  },
]; 