interface MessageSeed {
  id?: string;
  content: string;
  createdAt?: Date | string;
  readAt?: Date | string;
  senderId: string;
  maintenanceRequestId?: string;
  isAIGenerated?: boolean;
  attachment?: string;
}

// Entity IDs
const MANAGER1_ID = '2';
const MANAGER2_ID = '3';
const JOHN_ID = '4';
const EMMA_ID = '5';
const DAVID_ID = '6';
const LISA_ID = '7';
const JAMES_ID = '8';

// Maintenance request IDs (assuming)
const MAINTENANCE_REQ_1_ID = '1'; // Leaking Bathroom Sink
const MAINTENANCE_REQ_2_ID = '2'; // Broken Air Conditioning
const MAINTENANCE_REQ_6_ID = '6'; // Gas Smell in Kitchen (Emergency)

export const messages: MessageSeed[] = [
  // Messages for the leaking bathroom sink
  {
    content: 'I\'ve submitted a maintenance request for the bathroom sink leak. Please let me know when someone can come take a look.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 minutes after creation
    senderId: JOHN_ID,
    maintenanceRequestId: MAINTENANCE_REQ_1_ID,
  },
  {
    content: 'Thank you for reporting this, John. We\'ve scheduled a plumber to come next Tuesday between 10am-12pm. Will that work for you?',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 45 minutes after first message
    readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours after creation
    senderId: MANAGER1_ID,
    maintenanceRequestId: MAINTENANCE_REQ_1_ID,
  },
  {
    content: 'Yes, that works for me. I\'ll be home during that time. Thank you!',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000), // 2.5 hours after first message
    readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 30 minutes after creation
    senderId: JOHN_ID,
    maintenanceRequestId: MAINTENANCE_REQ_1_ID,
  },
  
  // Messages for the broken air conditioning
  {
    content: 'My AC isn\'t cooling at all, and it\'s very hot in here. Can someone come look at it soon? It\'s 82 degrees inside right now.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000), // 15 minutes after creation
    senderId: DAVID_ID,
    maintenanceRequestId: MAINTENANCE_REQ_2_ID,
  },
  {
    content: 'This is an urgent issue, especially with the current heat wave. I\'ve arranged for an HVAC technician to come tomorrow. In the meantime, we\'ll deliver a portable AC unit to you within the next 2 hours. Does that work?',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000), // 20 minutes after first message
    readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000), // 5 minutes after creation
    senderId: MANAGER1_ID,
    maintenanceRequestId: MAINTENANCE_REQ_2_ID,
  },
  {
    content: 'Thank you, that would be very helpful! I\'ll be home all day.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 minutes after first message
    readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000), // 5 minutes after creation
    senderId: DAVID_ID,
    maintenanceRequestId: MAINTENANCE_REQ_2_ID,
  },
  {
    content: 'Update: The HVAC technician has identified a compressor issue. Parts are ordered and repair is scheduled for tomorrow at 9am. The technician will need access to both your unit and the external AC units.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    readAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000), // 1 hour after creation
    senderId: MANAGER1_ID,
    maintenanceRequestId: MAINTENANCE_REQ_2_ID,
  },
  
  // Messages for the gas smell emergency
  {
    content: 'URGENT: I smell gas in my kitchen around the stove area. The smell is quite strong.',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    readAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 3 * 60 * 1000), // 3 minutes after creation
    senderId: JOHN_ID,
    maintenanceRequestId: MAINTENANCE_REQ_6_ID,
  },
  {
    content: 'This is an emergency situation. Please open windows, don\'t use any electrical switches, and exit the apartment if the smell is strong. Our emergency maintenance team has been dispatched and will arrive within 15 minutes. The gas company has also been notified.',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 5 * 60 * 1000), // 5 minutes after first message
    readAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 6 * 60 * 1000), // 1 minute after creation
    senderId: MANAGER1_ID,
    maintenanceRequestId: MAINTENANCE_REQ_6_ID,
    isAIGenerated: true,
  },
  {
    content: 'I\'ve opened windows and am waiting outside. Thank you for the quick response.',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 8 * 60 * 1000), // 8 minutes after first message
    readAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 9 * 60 * 1000), // 1 minute after creation
    senderId: JOHN_ID,
    maintenanceRequestId: MAINTENANCE_REQ_6_ID,
  },
  {
    content: 'Our team has identified a loose connection in your gas stove. We\'ve temporarily shut off the gas to your unit and are making repairs now. It should be fixed within the hour. You can return to your unit, but please don\'t use the stove until we give the all-clear.',
    createdAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000), // 5.5 hours ago
    readAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000 + 2 * 60 * 1000), // 2 minutes after creation
    senderId: MANAGER1_ID,
    maintenanceRequestId: MAINTENANCE_REQ_6_ID,
  },
  
  // General property message (no maintenance request)
  {
    content: 'Reminder to all Sunrise Apartments residents: The quarterly maintenance check is scheduled for next Monday. We\'ll be inspecting smoke detectors, HVAC filters, and plumbing in all units. Please expect maintenance staff between 9am-4pm.',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    senderId: MANAGER1_ID,
  },
]; 