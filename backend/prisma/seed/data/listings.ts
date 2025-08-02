import { ListingStatus } from '@prisma/client';

interface ListingSeed {
  id?: string;
  title: string;
  description: string;
  rent: number;
  availableDate: Date | string;
  leaseTerms?: string;
  isActive?: boolean;
  status?: ListingStatus;
  propertyId: string;
  unitId?: string;
  createdById: string;
  viewCount?: number;
}

// Entity IDs
const MANAGER1_ID = '2'; // Sarah Johnson
const MANAGER2_ID = '3'; // Michael Thompson

// Property IDs
const SUNRISE_APARTMENTS_ID = '1';
const PARKVIEW_TOWNHOMES_ID = '2';
const OAKRIDGE_HOUSE_ID = '3';
const BAYVIEW_CONDOS_ID = '4';
const TECH_PLAZA_ID = '5';

// Available Unit IDs (units that don't have tenants)
const UNIT_201_ID = '3'; // Sunrise Apartments Unit 201 - Available
const UNIT_301_ID = '4'; // Sunrise Apartments Unit 301 - Available
const UNIT_B2_ID = '6';  // Parkview Townhomes Unit B2 - Available
const UNIT_3C_ID = '10'; // Bayview Condos Unit 3C - Available
const SUITE_101_ID = '11'; // Tech Plaza Suite 101 - Available
const SUITE_201_ID = '12'; // Tech Plaza Suite 201 - Available

export const listings: ListingSeed[] = [
  // Sunrise Apartments - Unit 201
  {
    title: 'Spacious 2BR/2BA Apartment with Bay Views',
    description: `Beautiful 2-bedroom, 2-bathroom apartment in the heart of San Francisco with stunning bay views. This modern unit features:

• 1,050 sq ft of living space
• Floor-to-ceiling windows with natural light
• In-unit washer/dryer
• Stainless steel appliances
• Hardwood floors throughout
• Private balcony with city views
• Walk-in closet in master bedroom
• Central air conditioning

Building amenities include:
• 24/7 security
• Rooftop deck with panoramic views
• Fitness center
• Community room
• Parking garage (additional fee)
• Pet-friendly building

Located in the vibrant SOMA district, walking distance to public transportation, restaurants, and shopping. Perfect for professionals or couples looking for luxury living in the city.`,
    rent: 3500,
    availableDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    leaseTerms: 'Minimum 12-month lease. First month, last month, and security deposit required. Utilities (water, trash) included. Tenant responsible for electricity, internet, and cable.',
    isActive: true,
    status: ListingStatus.ACTIVE,
    propertyId: SUNRISE_APARTMENTS_ID,
    unitId: UNIT_201_ID,
    createdById: MANAGER1_ID,
    viewCount: 45,
  },

  // Sunrise Apartments - Unit 301
  {
    title: 'Luxury 2BR/2.5BA Penthouse-Style Apartment',
    description: `Stunning penthouse-style apartment on the top floor with premium finishes and breathtaking views. Features include:

• 1,200 sq ft of premium living space
• Floor-to-ceiling windows
• Gourmet kitchen with granite countertops
• In-unit washer/dryer
• Stainless steel appliances
• Hardwood floors
• Fireplace in living room
• Private balcony with panoramic city views
• Walk-in closets
• Central air conditioning
• Ceiling fans throughout

This is the crown jewel of Sunrise Apartments, offering the ultimate in luxury living. Building amenities include rooftop deck, fitness center, 24/7 security, and more.

Perfect for executives or anyone seeking the finest in urban living.`,
    rent: 4000,
    availableDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    leaseTerms: 'Minimum 12-month lease. First month, last month, and security deposit required. Utilities (water, trash) included. Tenant responsible for electricity, internet, and cable.',
    isActive: true,
    status: ListingStatus.ACTIVE,
    propertyId: SUNRISE_APARTMENTS_ID,
    unitId: UNIT_301_ID,
    createdById: MANAGER1_ID,
    viewCount: 67,
  },

  // Parkview Townhomes - Unit B2
  {
    title: 'Spacious 3BR/2.5BA Townhome with Private Garden',
    description: `Beautiful 3-bedroom, 2.5-bathroom townhome in a quiet, family-friendly community. This home offers:

• 1,650 sq ft of comfortable living space
• Open floor plan perfect for entertaining
• Gourmet kitchen with stainless steel appliances
• In-unit washer/dryer
• Hardwood floors throughout
• Fireplace in living room
• Private patio and garden area
• Attached garage
• Walk-in closets
• Central air conditioning
• Basement for additional storage

Community amenities include:
• Swimming pool
• Playground for children
• Walking trails
• Dog park
• Gated community with security

Located adjacent to Central Park with easy access to shopping, dining, and schools. Perfect for families or professionals who want space and tranquility.`,
    rent: 4200,
    availableDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    leaseTerms: 'Minimum 12-month lease. First month, last month, and security deposit required. Tenant responsible for all utilities. Pet-friendly with additional deposit.',
    isActive: true,
    status: ListingStatus.ACTIVE,
    propertyId: PARKVIEW_TOWNHOMES_ID,
    unitId: UNIT_B2_ID,
    createdById: MANAGER1_ID,
    viewCount: 32,
  },

  // Bayview Condos - Unit 3C
  {
    title: 'Luxury 3BR/2.5BA Waterfront Condo with Stunning Views',
    description: `Exceptional 3-bedroom, 2.5-bathroom luxury condominium with breathtaking waterfront views. This premium unit features:

• 1,400 sq ft of elegant living space
• Floor-to-ceiling windows overlooking the bay
• Gourmet kitchen with premium appliances
• In-unit washer/dryer
• Hardwood floors throughout
• Fireplace in living room
• Private balcony with water views
• Walk-in closets
• Central air conditioning
• Ceiling fans

Building amenities include:
• 24/7 concierge service
• Rooftop deck with panoramic views
• State-of-the-art fitness center
• Spa and wellness center
• Wine cellar
• Conference room
• Guest suites for visitors
• Parking garage

This is luxury living at its finest, perfect for discerning professionals or anyone who appreciates the finer things in life.`,
    rent: 4800,
    availableDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    leaseTerms: 'Minimum 12-month lease. First month, last month, and security deposit required. Utilities (water, trash) included. No pets allowed per condo association rules.',
    isActive: true,
    status: ListingStatus.ACTIVE,
    propertyId: BAYVIEW_CONDOS_ID,
    unitId: UNIT_3C_ID,
    createdById: MANAGER2_ID,
    viewCount: 89,
  },

  // Tech Plaza - Suite 101
  {
    title: 'Modern Office Space in Tech Hub - Perfect for Startups',
    description: `Modern office suite in the heart of Mountain View's tech corridor. Ideal for startups, small businesses, or satellite offices. Features include:

• 800 sq ft of flexible office space
• Open floor plan with natural light
• High-speed fiber internet included
• Kitchenette with modern appliances
• Professional reception area nearby
• Window views of the courtyard
• 24/7 access
• Climate controlled

Building amenities include:
• Conference rooms available for rent
• High-speed internet throughout
• Cafeteria on-site
• Bike storage
• Shower facilities
• 24/7 security
• Ample parking

Located in the innovation district, walking distance to Caltrain, restaurants, and other tech companies. Perfect for growing businesses that want to be in the center of Silicon Valley action.`,
    rent: 3000,
    availableDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    leaseTerms: 'Minimum 12-month lease. First month, last month, and security deposit (2 months) required. Utilities and high-speed internet included.',
    isActive: true,
    status: ListingStatus.ACTIVE,
    propertyId: TECH_PLAZA_ID,
    unitId: SUITE_101_ID,
    createdById: MANAGER1_ID,
    viewCount: 23,
  },

  // Tech Plaza - Suite 201
  {
    title: 'Premium Office Suite with Conference Room - Ready to Move In',
    description: `Premium office suite perfect for established businesses or growing teams. This executive-level space offers:

• 1,500 sq ft of professional office space
• Private conference room for meetings
• Reception area with professional appearance
• Kitchenette with premium appliances
• Private restroom
• Floor-to-ceiling windows with natural light
• High-speed fiber internet included
• 24/7 access
• Climate controlled throughout

Building amenities include:
• Additional conference rooms available
• Professional cafeteria
• Fitness facilities
• Bike storage and showers
• 24/7 security and concierge
• Ample parking
• Electric vehicle charging stations

This is the perfect space for companies that want to make a professional impression while being located in the heart of Silicon Valley's tech ecosystem.`,
    rent: 5500,
    availableDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    leaseTerms: 'Minimum 12-month lease. First month, last month, and security deposit (2 months) required. Utilities and high-speed internet included.',
    isActive: true,
    status: ListingStatus.ACTIVE,
    propertyId: TECH_PLAZA_ID,
    unitId: SUITE_201_ID,
    createdById: MANAGER1_ID,
    viewCount: 41,
  },
];