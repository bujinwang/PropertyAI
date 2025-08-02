interface NotificationSeed {
  id?: string;
  message: string;
  type: string;
  createdAt?: Date | string;
  isRead?: boolean;
  userId: string;
  link?: string;
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
    message: 'Your maintenance request for "Leaking Bathroom Sink" has been received and is being processed.',
    type: 'maintenance_update',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isRead: true,
    userId: JOHN_ID,
    link: '/maintenance-requests/1',
  },
  {
    message: 'Your maintenance request for "Broken Air Conditioning" has been updated to status: In Progress.',
    type: 'maintenance_update',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000), // 2 days ago + 1 hour
    isRead: true,
    userId: DAVID_ID,
    link: '/maintenance-requests/2',
  },
  {
    message: 'Your rent payment of $2,500 is due in 5 days on June 1st, 2024.',
    type: 'payment_reminder',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    isRead: false, // Unread
    userId: JOHN_ID,
    link: '/payments',
  },
  {
    message: 'Your lease for Unit A1 at Parkview Townhomes is set to expire in 60 days. Please contact the property manager to discuss renewal options.',
    type: 'lease_renewal',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    isRead: true,
    userId: DAVID_ID,
    link: '/lease',
  },
  {
    message: 'An emergency maintenance crew has been dispatched to address your report of a gas smell. Please ensure they have access to your unit.',
    type: 'emergency_maintenance',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 5 * 60 * 1000), // 6 hours ago + 5 minutes
    isRead: true,
    userId: JOHN_ID,
    link: '/maintenance-requests/6',
  },
  
  // Property manager notifications
  {
    message: 'A new maintenance request has been submitted: "Leaking Bathroom Sink" at Sunrise Apartments, Unit 101.',
    type: 'new_maintenance_request',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 1000), // 3 days ago + 1 minute
    isRead: true,
    userId: MANAGER1_ID,
    link: '/maintenance-requests/1',
  },
  {
    message: 'A high priority maintenance request has been submitted: "Broken Air Conditioning" at Parkview Townhomes, Unit A1.',
    type: 'new_maintenance_request',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1 * 60 * 1000), // 2 days ago + 1 minute
    isRead: true,
    userId: MANAGER1_ID,
    link: '/maintenance-requests/2',
  },
  {
    message: 'EMERGENCY: Gas smell reported at Sunrise Apartments, Unit 101. Immediate response required.',
    type: 'emergency_maintenance',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 1 * 60 * 1000), // 6 hours ago + 1 minute
    isRead: true,
    userId: MANAGER1_ID,
    link: '/maintenance-requests/6',
  },
  {
    message: '3 leases are set to expire in the next 60 days. Review needed.',
    type: 'lease_expiring',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    isRead: true,
    userId: MANAGER1_ID,
    link: '/leases',
  },
  
  // Admin notifications
  {
    message: 'The monthly financial report for May 2024 is now available for review.',
    type: 'financial_report',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    isRead: false, // Unread
    userId: ADMIN_ID,
    link: '/reports/financial',
  },
  {
    message: 'An emergency maintenance incident (gas leak) was reported and addressed at Sunrise Apartments, Unit 101.',
    type: 'incident_report',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    isRead: true,
    userId: ADMIN_ID,
    link: '/maintenance-requests/6',
  },
]; 