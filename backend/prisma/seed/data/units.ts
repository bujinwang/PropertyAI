interface UnitSeed {
  id?: string;
  unitNumber: string;
  floorNumber?: number;
  size?: number;
  bedrooms?: number;
  bathrooms?: number;
  rent?: number;
  deposit?: number;
  isAvailable?: boolean;
  dateAvailable?: Date | string;
  features?: any;
  propertyId: string;
  tenantId?: string;
}

// Property IDs - These would match the IDs generated for properties
// For simplicity in seeding, we're hardcoding these values
const SUNRISE_APARTMENTS_ID = '1';
const PARKVIEW_TOWNHOMES_ID = '2';
const OAKRIDGE_HOUSE_ID = '3';
const BAYVIEW_CONDOS_ID = '4';
const TECH_PLAZA_ID = '5';

// Tenant IDs - These would match the IDs generated for users with TENANT role
const JOHN_ID = '4';
const EMMA_ID = '5';
const DAVID_ID = '6';
const LISA_ID = '7';
const JAMES_ID = '8';
const OLIVIA_ID = '9';

export const units: UnitSeed[] = [
  // Sunrise Apartments Units
  {
    unitNumber: '101',
    floorNumber: 1,
    size: 750,
    bedrooms: 1,
    bathrooms: 1,
    rent: 2500,
    deposit: 2500,
    isAvailable: false,
    features: {
      hasWasherDryer: true,
      hasAC: true,
      hasBalcony: true,
      hasWalkInCloset: false,
      hasStainlessSteelAppliances: true,
      hasHardwoodFloors: true,
      furnished: false
    },
    propertyId: SUNRISE_APARTMENTS_ID,
    tenantId: JOHN_ID,
  },
  {
    unitNumber: '102',
    floorNumber: 1,
    size: 850,
    bedrooms: 1,
    bathrooms: 1,
    rent: 2700,
    deposit: 2700,
    isAvailable: false,
    features: {
      hasWasherDryer: true,
      hasAC: true,
      hasBalcony: true,
      hasWalkInCloset: true,
      hasStainlessSteelAppliances: true,
      hasHardwoodFloors: true,
      furnished: false
    },
    propertyId: SUNRISE_APARTMENTS_ID,
    tenantId: EMMA_ID,
  },
  {
    unitNumber: '201',
    floorNumber: 2,
    size: 1050,
    bedrooms: 2,
    bathrooms: 2,
    rent: 3500,
    deposit: 3500,
    isAvailable: true,
    dateAvailable: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    features: {
      hasWasherDryer: true,
      hasAC: true,
      hasBalcony: true,
      hasWalkInCloset: true,
      hasStainlessSteelAppliances: true,
      hasHardwoodFloors: true,
      hasFireplace: true,
      furnished: false
    },
    propertyId: SUNRISE_APARTMENTS_ID,
  },
  {
    unitNumber: '301',
    floorNumber: 3,
    size: 1200,
    bedrooms: 2,
    bathrooms: 2.5,
    rent: 4000,
    deposit: 4000,
    isAvailable: true,
    features: {
      hasWasherDryer: true,
      hasAC: true,
      hasBalcony: true,
      hasWalkInCloset: true,
      hasStainlessSteelAppliances: true,
      hasHardwoodFloors: true,
      hasFireplace: true,
      hasCeilingFans: true,
      furnished: false
    },
    propertyId: SUNRISE_APARTMENTS_ID,
  },
  
  // Parkview Townhomes Units
  {
    unitNumber: 'A1',
    floorNumber: 1, // Multiple floors, but primary level
    size: 1500,
    bedrooms: 2,
    bathrooms: 2.5,
    rent: 3800,
    deposit: 3800,
    isAvailable: false,
    features: {
      hasWasherDryer: true,
      hasAC: true,
      hasPatioGarden: true,
      hasWalkInCloset: true,
      hasStainlessSteelAppliances: true,
      hasHardwoodFloors: true,
      hasFireplace: true,
      hasGarage: true,
      furnished: false
    },
    propertyId: PARKVIEW_TOWNHOMES_ID,
    tenantId: DAVID_ID,
  },
  {
    unitNumber: 'B2',
    floorNumber: 1,
    size: 1650,
    bedrooms: 3,
    bathrooms: 2.5,
    rent: 4200,
    deposit: 4200,
    isAvailable: true,
    dateAvailable: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    features: {
      hasWasherDryer: true,
      hasAC: true,
      hasPatioGarden: true,
      hasWalkInCloset: true,
      hasStainlessSteelAppliances: true,
      hasHardwoodFloors: true,
      hasFireplace: true,
      hasGarage: true,
      hasBasement: true,
      furnished: false
    },
    propertyId: PARKVIEW_TOWNHOMES_ID,
  },
  
  // Oakridge House
  {
    unitNumber: 'Main House',
    size: 2200,
    bedrooms: 4,
    bathrooms: 3,
    rent: 5500,
    deposit: 5500,
    isAvailable: false,
    features: {
      hasWasherDryer: true,
      hasAC: true,
      hasBackyard: true,
      hasDeck: true,
      hasGarage: true,
      hasWalkInCloset: true,
      hasStainlessSteelAppliances: true,
      hasHardwoodFloors: true,
      hasFireplace: true,
      hasBasement: true,
      furnished: false
    },
    propertyId: OAKRIDGE_HOUSE_ID,
    tenantId: LISA_ID,
  },
  
  // Bayview Condos Units
  {
    unitNumber: '1A',
    floorNumber: 1,
    size: 950,
    bedrooms: 1,
    bathrooms: 1.5,
    rent: 3000,
    deposit: 3000,
    isAvailable: false,
    features: {
      hasWasherDryer: true,
      hasAC: true,
      hasBalcony: true,
      hasWalkInCloset: true,
      hasStainlessSteelAppliances: true,
      hasHardwoodFloors: true,
      hasFireplace: false,
      furnished: false
    },
    propertyId: BAYVIEW_CONDOS_ID,
    tenantId: JAMES_ID,
  },
  {
    unitNumber: '2B',
    floorNumber: 2,
    size: 1150,
    bedrooms: 2,
    bathrooms: 2,
    rent: 3900,
    deposit: 3900,
    isAvailable: false,
    features: {
      hasWasherDryer: true,
      hasAC: true,
      hasBalcony: true,
      hasWalkInCloset: true,
      hasStainlessSteelAppliances: true,
      hasHardwoodFloors: true,
      hasFireplace: true,
      furnished: false
    },
    propertyId: BAYVIEW_CONDOS_ID,
    tenantId: OLIVIA_ID,
  },
  {
    unitNumber: '3C',
    floorNumber: 3,
    size: 1400,
    bedrooms: 3,
    bathrooms: 2.5,
    rent: 4800,
    deposit: 4800,
    isAvailable: true,
    features: {
      hasWasherDryer: true,
      hasAC: true,
      hasBalcony: true,
      hasWalkInCloset: true,
      hasStainlessSteelAppliances: true,
      hasHardwoodFloors: true,
      hasFireplace: true,
      hasCeilingFans: true,
      furnished: false
    },
    propertyId: BAYVIEW_CONDOS_ID,
  },
  
  // Tech Plaza Office Units
  {
    unitNumber: 'Suite 101',
    floorNumber: 1,
    size: 800,
    rent: 3000,
    deposit: 6000,
    isAvailable: true,
    features: {
      hasHighSpeedInternet: true,
      hasConferenceRoom: false,
      hasKitchenette: true,
      hasReception: false,
      hasWindow: true,
      hasPrivateRestroom: false,
    },
    propertyId: TECH_PLAZA_ID,
  },
  {
    unitNumber: 'Suite 201',
    floorNumber: 2,
    size: 1500,
    rent: 5500,
    deposit: 11000,
    isAvailable: true,
    features: {
      hasHighSpeedInternet: true,
      hasConferenceRoom: true,
      hasKitchenette: true,
      hasReception: true,
      hasWindow: true,
      hasPrivateRestroom: true,
    },
    propertyId: TECH_PLAZA_ID,
  },
]; 