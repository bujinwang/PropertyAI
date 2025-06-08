import { LeaseStatus } from '@prisma/client';

interface LeaseSeed {
  id?: string;
  startDate: Date | string;
  endDate: Date | string;
  rentAmount: number;
  securityDeposit: number;
  leaseTerms?: string;
  status: LeaseStatus;
  signedDate?: Date | string;
  unitId: string;
  renewalDate?: Date | string;
}

// Unit IDs - These would match the IDs generated for units
// These are occupied units that have tenants and therefore would have leases
const UNIT_101_ID = '1'; // Sunrise Apartments Unit 101 - John
const UNIT_102_ID = '2'; // Sunrise Apartments Unit 102 - Emma
const UNIT_A1_ID = '5';  // Parkview Townhomes Unit A1 - David
const OAKRIDGE_HOUSE_ID = '7'; // Oakridge House - Lisa
const UNIT_1A_ID = '8';  // Bayview Condos Unit 1A - James
const UNIT_2B_ID = '9';  // Bayview Condos Unit 2B - Olivia

export const leases: LeaseSeed[] = [
  // Sunrise Apartments Unit 101 - John Smith
  {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    rentAmount: 2500,
    securityDeposit: 2500,
    leaseTerms: `Standard 1-year lease agreement for Unit 101 at Sunrise Apartments.
    Rent is due on the 1st of each month.
    Utilities (water, trash) included; tenant responsible for electricity, internet, and cable.
    No pets allowed without prior written approval and pet deposit.
    Renewal terms to be negotiated 60 days before lease expiration.`,
    status: LeaseStatus.ACTIVE,
    signedDate: new Date('2023-12-15'),
    unitId: UNIT_101_ID,
    renewalDate: new Date('2024-10-31'),
  },
  
  // Sunrise Apartments Unit 102 - Emma Davis
  {
    startDate: new Date('2024-03-01'),
    endDate: new Date('2025-02-28'),
    rentAmount: 2700,
    securityDeposit: 2700,
    leaseTerms: `Standard 1-year lease agreement for Unit 102 at Sunrise Apartments.
    Rent is due on the 1st of each month.
    Utilities (water, trash) included; tenant responsible for electricity, internet, and cable.
    Pet deposit of $500 has been paid for one cat.
    Renewal terms to be negotiated 60 days before lease expiration.`,
    status: LeaseStatus.ACTIVE,
    signedDate: new Date('2024-02-15'),
    unitId: UNIT_102_ID,
    renewalDate: new Date('2024-12-31'),
  },
  
  // Parkview Townhomes Unit A1 - David Wilson
  {
    startDate: new Date('2023-08-01'),
    endDate: new Date('2024-07-31'),
    rentAmount: 3800,
    securityDeposit: 3800,
    leaseTerms: `Standard 1-year lease agreement for Unit A1 at Parkview Townhomes.
    Rent is due on the 1st of each month.
    Utilities (water, trash) included; tenant responsible for electricity, gas, internet, and cable.
    Pet deposit of $750 has been paid for one dog.
    Tenant responsible for lawn maintenance of private patio area.
    Renewal terms to be negotiated 60 days before lease expiration.`,
    status: LeaseStatus.ACTIVE,
    signedDate: new Date('2023-07-15'),
    unitId: UNIT_A1_ID,
    renewalDate: new Date('2024-05-31'),
  },
  
  // Oakridge House - Lisa Brown
  {
    startDate: new Date('2023-06-01'),
    endDate: new Date('2025-05-31'),
    rentAmount: 5500,
    securityDeposit: 5500,
    leaseTerms: `2-year lease agreement for Oakridge House.
    Rent is due on the 1st of each month.
    Tenant responsible for all utilities including water, electricity, gas, internet, cable, and trash.
    Tenant responsible for regular lawn maintenance and garden upkeep.
    Pet deposit of $1000 has been paid for two dogs.
    Renewal terms to be negotiated 90 days before lease expiration.`,
    status: LeaseStatus.ACTIVE,
    signedDate: new Date('2023-05-15'),
    unitId: OAKRIDGE_HOUSE_ID,
    renewalDate: new Date('2025-02-28'),
  },
  
  // Bayview Condos Unit 1A - James Miller
  {
    startDate: new Date('2024-02-01'),
    endDate: new Date('2025-01-31'),
    rentAmount: 3000,
    securityDeposit: 3000,
    leaseTerms: `Standard 1-year lease agreement for Unit 1A at Bayview Condos.
    Rent is due on the 1st of each month.
    Utilities (water, trash) included; tenant responsible for electricity, internet, and cable.
    No pets allowed as per condo association rules.
    Tenant must comply with all condo association regulations.
    Renewal terms to be negotiated 60 days before lease expiration.`,
    status: LeaseStatus.ACTIVE,
    signedDate: new Date('2024-01-15'),
    unitId: UNIT_1A_ID,
    renewalDate: new Date('2024-12-01'),
  },
  
  // Bayview Condos Unit 2B - Olivia Martinez
  {
    startDate: new Date('2023-10-01'),
    endDate: new Date('2024-09-30'),
    rentAmount: 3900,
    securityDeposit: 3900,
    leaseTerms: `Standard 1-year lease agreement for Unit 2B at Bayview Condos.
    Rent is due on the 1st of each month.
    Utilities (water, trash) included; tenant responsible for electricity, internet, and cable.
    No pets allowed as per condo association rules.
    Tenant must comply with all condo association regulations.
    Renewal terms to be negotiated 60 days before lease expiration.`,
    status: LeaseStatus.ACTIVE,
    signedDate: new Date('2023-09-15'),
    unitId: UNIT_2B_ID,
    renewalDate: new Date('2024-07-31'),
  },
]; 