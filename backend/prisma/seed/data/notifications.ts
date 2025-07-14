import { NotificationType } from '@prisma/client';

interface NotificationSeed {
  id?: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt?: Date | string;
  readAt?: Date | string | null;
  userId: string;
  relatedEntityId?: string;
  isActionRequired?: boolean;
}

// Entity IDs
const ADMIN_ID = '1';
const MANAGER1_ID = '2';
const JOHN_ID = '4';
const EMMA_ID = '5';
const DAVID_ID = '6';
const LISA_ID = '7';
const JAMES_ID = '8';
const OLIVIA_ID = '9';

// Maintenance request IDs (assuming)
const MAINTENANCE_REQ_1_ID = '1'; // Leaking Bathroom Sink
const MAINTENANCE_REQ_2_ID = '2'; // Broken Air Conditioning
const MAINTENANCE_REQ_6_ID = '6'; // Gas Smell in Kitchen (Emergency)

export const notifications: NotificationSeed[] = [
  // Tenant notifications
  {
    title: 'Maintenance Request Created',
    message: 'Your maintenance request for "Leaking Bathroom Sink" has been received and is being processed.',
    type: NotificationType.MAINTENANCE,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000), // 10 minutes after creation
    userId: JOHN_ID,
    relatedEntityId: MAINTENANCE_REQ_1_ID,
    isActionRequired: false,
  },
  {
    title: 'Maintenance Request Update',
    message: 'Your maintenance request for "Broken Air Conditioning" has been updated to status: In Progress.',
    type: NotificationType.MAINTENANCE,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000), // 2 days ago + 1 hour
    readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 1 hour after creation
    userId: DAVID_ID,
    relatedEntityId: MAINTENANCE_REQ_2_ID,
    isActionRequired: false,
  },
  {
    title: 'Rent Due Reminder',
    message: 'Your rent payment of $2,500 is due in 5 days on June 1st, 2024.',
    type: NotificationType.PAYMENT,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    readAt: null, // Unread
    userId: JOHN_ID,
    isActionRequired: true,
  },
  {
    title: 'Lease Renewal',
    message: 'Your lease for Unit A1 at Parkview Townhomes is set to expire in 60 days. Please contact the property manager to discuss renewal options.',
    type: NotificationType.LEASE,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    readAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // Read 1 day after creation
    userId: DAVID_ID,
    isActionRequired: true,
  },
  {
    title: 'Emergency Maintenance Action',
    message: 'An emergency maintenance crew has been dispatched to address your report of a gas smell. Please ensure they have access to your unit.',
    type: NotificationType.MAINTENANCE,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 5 * 60 * 1000), // 6 hours ago + 5 minutes
    readAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 6 * 60 * 1000), // 1 minute after creation
    userId: JOHN_ID,
    relatedEntityId: MAINTENANCE_REQ_6_ID,
    isActionRequired: true,
  },
  
  // Property manager notifications
  {
    title: 'New Maintenance Request',
    message: 'A new maintenance request has been submitted: "Leaking Bathroom Sink" at Sunrise Apartments, Unit 101.',
    type: NotificationType.MAINTENANCE,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 1000), // 3 days ago + 1 minute
    readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000), // 15 minutes after creation
    userId: MANAGER1_ID,
    relatedEntityId: MAINTENANCE_REQ_1_ID,
    isActionRequired: true,
  },
  {
    title: 'High Priority Maintenance Request',
    message: 'A high priority maintenance request has been submitted: "Broken Air Conditioning" at Parkview Townhomes, Unit A1.',
    type: NotificationType.MAINTENANCE,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1 * 60 * 1000), // 2 days ago + 1 minute
    readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000), // 5 minutes after creation
    userId: MANAGER1_ID,
    relatedEntityId: MAINTENANCE_REQ_2_ID,
    isActionRequired: true,
  },
  {
    title: 'Emergency Maintenance Request',
    message: 'EMERGENCY: Gas smell reported at Sunrise Apartments, Unit 101. Immediate response required.',
    type: NotificationType.MAINTENANCE,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 1 * 60 * 1000), // 6 hours ago + 1 minute
    readAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 2 * 60 * 1000), // 1 minute after creation
    userId: MANAGER1_ID,
    relatedEntityId: MAINTENANCE_REQ_6_ID,
    isActionRequired: true,
  },
  {
    title: 'Lease Expiring Soon',
    message: '3 leases are set to expire in the next 60 days. Review needed.',
    type: NotificationType.LEASE,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    readAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // Read 1 day after creation
    userId: MANAGER1_ID,
    isActionRequired: true,
  },
  
  // Admin notifications
  {
    title: 'Monthly Financial Report',
    message: 'The monthly financial report for May 2024 is now available for review.',
    type: NotificationType.OTHER,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    readAt: null, // Unread
    userId: ADMIN_ID,
    isActionRequired: true,
  },
  {
    title: 'Emergency Maintenance Incident',
    message: 'An emergency maintenance incident (gas leak) was reported and addressed at Sunrise Apartments, Unit 101.',
    type: NotificationType.MAINTENANCE,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    readAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000), // Read 30 minutes after creation
    userId: ADMIN_ID,
    relatedEntityId: MAINTENANCE_REQ_6_ID,
    isActionRequired: false,
  },
]; 