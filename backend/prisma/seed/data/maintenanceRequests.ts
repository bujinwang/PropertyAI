import { MaintenanceStatus, Priority } from '@prisma/client';

interface MaintenanceRequestSeed {
  id?: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  priority: Priority;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  scheduledDate?: Date | string;
  completedDate?: Date | string;
  notes?: string;
  propertyId: string;
  unitId: string;
  requestedById: string;
  assignedToId?: string;
  estimatedCost?: number;
  actualCost?: number;
}

// Entity IDs
const MANAGER1_ID = '2';
const MANAGER2_ID = '3';
const JOHN_ID = '4';
const EMMA_ID = '5';
const DAVID_ID = '6';
const LISA_ID = '7';
const JAMES_ID = '8';

const SUNRISE_APARTMENTS_ID = '1';
const PARKVIEW_TOWNHOMES_ID = '2';
const OAKRIDGE_HOUSE_ID = '3';
const BAYVIEW_CONDOS_ID = '4';

const UNIT_101_ID = '1'; // Sunrise Apartments Unit 101 - John
const UNIT_102_ID = '2'; // Sunrise Apartments Unit 102 - Emma
const UNIT_A1_ID = '5';  // Parkview Townhomes Unit A1 - David
const OAKRIDGE_HOUSE_UNIT_ID = '7'; // Oakridge House - Lisa
const UNIT_1A_ID = '8';  // Bayview Condos Unit 1A - James

export const maintenanceRequests: MaintenanceRequestSeed[] = [
  // Active requests
  {
    title: 'Leaking Bathroom Sink',
    description: 'The bathroom sink has a slow leak underneath the cabinet. There is a small puddle forming after each use.',
    status: MaintenanceStatus.OPEN,
    priority: Priority.MEDIUM,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    notes: 'Scheduled for inspection next week.',
    propertyId: SUNRISE_APARTMENTS_ID,
    unitId: UNIT_101_ID,
    requestedById: JOHN_ID,
    estimatedCost: 150,
  },
  {
    title: 'Broken Air Conditioning',
    description: 'The air conditioning unit is not cooling properly. Current temperature is 82°F even with AC set to 72°F.',
    status: MaintenanceStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    notes: 'HVAC technician will come tomorrow. Initial inspection suggests compressor issue.',
    propertyId: PARKVIEW_TOWNHOMES_ID,
    unitId: UNIT_A1_ID,
    requestedById: DAVID_ID,
    assignedToId: MANAGER1_ID,
    estimatedCost: 600,
  },
  {
    title: 'Replace Smoke Detector Batteries',
    description: 'The smoke detector in the hallway is chirping, likely due to low batteries.',
    status: MaintenanceStatus.OPEN,
    priority: Priority.LOW,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    notes: 'Will include in routine maintenance visit next week.',
    propertyId: SUNRISE_APARTMENTS_ID,
    unitId: UNIT_102_ID,
    requestedById: EMMA_ID,
    estimatedCost: 15,
  },
  {
    title: 'Roof Leak During Heavy Rain',
    description: 'During the last rainstorm, there was water dripping from the ceiling in the master bedroom, near the exterior wall.',
    status: MaintenanceStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    scheduledDate: new Date(Date.now()),
    notes: 'Roofer inspected yesterday, identified damaged shingles. Repair scheduled for today.',
    propertyId: OAKRIDGE_HOUSE_ID,
    unitId: OAKRIDGE_HOUSE_UNIT_ID,
    requestedById: LISA_ID,
    assignedToId: MANAGER2_ID,
    estimatedCost: 850,
  },
  
  // Completed request
  {
    title: 'Replace Kitchen Faucet',
    description: 'The kitchen faucet is leaking and the spray function does not work. Would like to have it replaced if possible.',
    status: MaintenanceStatus.COMPLETED,
    priority: Priority.MEDIUM,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    scheduledDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    completedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    notes: 'Replaced with new Delta touchless faucet. Tested and working well. Tenant very satisfied with upgrade.',
    propertyId: BAYVIEW_CONDOS_ID,
    unitId: UNIT_1A_ID,
    requestedById: JAMES_ID,
    assignedToId: MANAGER2_ID,
    estimatedCost: 220,
    actualCost: 245.75,
  },
  
  // Emergency request
  {
    title: 'Gas Smell in Kitchen',
    description: 'There is a distinct smell of gas coming from around the stove area. Very concerned as the smell is strong.',
    status: MaintenanceStatus.IN_PROGRESS,
    priority: Priority.EMERGENCY,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    scheduledDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    notes: 'Emergency response team dispatched immediately. Gas company also notified. Preliminary inspection identified loose connection in gas stove. Temporarily shut off gas to unit, repair in progress.',
    propertyId: SUNRISE_APARTMENTS_ID,
    unitId: UNIT_101_ID,
    requestedById: JOHN_ID,
    assignedToId: MANAGER1_ID,
    estimatedCost: 300,
  },
]; 