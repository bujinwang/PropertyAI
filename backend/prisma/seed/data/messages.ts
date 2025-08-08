interface MessageSeed {
  id?: string;
  content: string;
  createdAt?: Date | string;
  readAt?: Date | string;
  senderId: string;
  receiverId: string;
  maintenanceRequestId?: string;
  isAIGenerated?: boolean;
  attachment?: string;
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  sentimentScore?: number;
  category?: string;
  isEarlyWarning?: boolean;
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
    receiverId: MANAGER1_ID,
    maintenanceRequestId: MAINTENANCE_REQ_1_ID,
    sentiment: 'NEUTRAL',
    sentimentScore: 0.1,
    category: 'plumbing',
    isEarlyWarning: false,
  },
  {
    content: 'Thank you for reporting this, John. We\'ve scheduled a plumber to come next Tuesday between 10am-12pm. Will that work for you?',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 45 minutes after first message
    readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours after creation
    senderId: MANAGER1_ID,
    receiverId: JOHN_ID,
    maintenanceRequestId: MAINTENANCE_REQ_1_ID,
    sentiment: 'POSITIVE',
    sentimentScore: 0.7,
    category: 'response',
    isEarlyWarning: false,
  },
  {
    content: 'Yes, that works for me. I\'ll be home during that time. Thank you!',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000), // 2.5 hours after first message
    readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 30 minutes after creation
    senderId: JOHN_ID,
    receiverId: MANAGER1_ID,
    maintenanceRequestId: MAINTENANCE_REQ_1_ID,
    sentiment: 'POSITIVE',
    sentimentScore: 0.8,
    category: 'satisfaction',
    isEarlyWarning: false,
  },
  
  // Messages for the broken air conditioning
  {
    content: 'My AC isn\'t cooling at all, and it\'s very hot in here. Can someone come look at it soon? It\'s 82 degrees inside right now.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000), // 15 minutes after creation
    senderId: DAVID_ID,
    receiverId: MANAGER1_ID,
    maintenanceRequestId: MAINTENANCE_REQ_2_ID,
    sentiment: 'NEGATIVE',
    sentimentScore: -0.6,
    category: 'hvac',
    isEarlyWarning: true,
  },
  {
    content: 'This is an urgent issue, especially with the current heat wave. I\'ve arranged for an HVAC technician to come tomorrow. In the meantime, we\'ll deliver a portable AC unit to you within the next 2 hours. Does that work?',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000), // 20 minutes after first message
    readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000), // 5 minutes after creation
    senderId: MANAGER1_ID,
    receiverId: DAVID_ID,
    maintenanceRequestId: MAINTENANCE_REQ_2_ID,
    sentiment: 'POSITIVE',
    sentimentScore: 0.8,
    category: 'response',
    isEarlyWarning: false,
  },
  {
    content: 'Thank you, that would be very helpful! I\'ll be home all day.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 minutes after first message
    readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000), // 5 minutes after creation
    senderId: DAVID_ID,
    receiverId: MANAGER1_ID,
    maintenanceRequestId: MAINTENANCE_REQ_2_ID,
    sentiment: 'POSITIVE',
    sentimentScore: 0.9,
    category: 'satisfaction',
    isEarlyWarning: false,
  },
  {
    content: 'Update: The HVAC technician has identified a compressor issue. Parts are ordered and repair is scheduled for tomorrow at 9am. The technician will need access to both your unit and the external AC units.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    readAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000), // 1 hour after creation
    senderId: MANAGER1_ID,
    receiverId: DAVID_ID,
    maintenanceRequestId: MAINTENANCE_REQ_2_ID,
    sentiment: 'NEUTRAL',
    sentimentScore: 0.2,
    category: 'update',
    isEarlyWarning: false,
  },
  
  // Messages for the gas smell emergency
  {
    content: 'URGENT: I smell gas in my kitchen around the stove area. The smell is quite strong.',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    readAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 3 * 60 * 1000), // 3 minutes after creation
    senderId: JOHN_ID,
    receiverId: MANAGER1_ID,
    maintenanceRequestId: MAINTENANCE_REQ_6_ID,
    sentiment: 'NEGATIVE',
    sentimentScore: -0.9,
    category: 'emergency',
    isEarlyWarning: true,
  },
  {
    content: 'This is an emergency situation. Please open windows, don\'t use any electrical switches, and exit the apartment if the smell is strong. Our emergency maintenance team has been dispatched and will arrive within 15 minutes. The gas company has also been notified.',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 5 * 60 * 1000), // 5 minutes after first message
    readAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 6 * 60 * 1000), // 1 minute after creation
    senderId: MANAGER1_ID,
    receiverId: JOHN_ID,
    maintenanceRequestId: MAINTENANCE_REQ_6_ID,
    isAIGenerated: true,
    sentiment: 'NEUTRAL',
    sentimentScore: 0.0,
    category: 'emergency_response',
    isEarlyWarning: false,
  },
  {
    content: 'I\'ve opened windows and am waiting outside. Thank you for the quick response.',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 8 * 60 * 1000), // 8 minutes after first message
    readAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 9 * 60 * 1000), // 1 minute after creation
    senderId: JOHN_ID,
    receiverId: MANAGER1_ID,
    maintenanceRequestId: MAINTENANCE_REQ_6_ID,
    sentiment: 'POSITIVE',
    sentimentScore: 0.6,
    category: 'compliance',
    isEarlyWarning: false,
  },
  {
    content: 'Our team has identified a loose connection in your gas stove. We\'ve temporarily shut off the gas to your unit and are making repairs now. It should be fixed within the hour. You can return to your unit, but please don\'t use the stove until we give the all-clear.',
    createdAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000), // 5.5 hours ago
    readAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000 + 2 * 60 * 1000), // 2 minutes after creation
    senderId: MANAGER1_ID,
    receiverId: JOHN_ID,
    maintenanceRequestId: MAINTENANCE_REQ_6_ID,
    sentiment: 'POSITIVE',
    sentimentScore: 0.5,
    category: 'resolution',
    isEarlyWarning: false,
  },
  
  // Additional messages for sentiment analytics variety
  {
    content: 'The noise from the upstairs unit has been going on for weeks now. It\'s really affecting my sleep and I\'m getting frustrated. When can this be addressed?',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    readAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
    senderId: EMMA_ID,
    receiverId: MANAGER1_ID,
    sentiment: 'NEGATIVE',
    sentimentScore: -0.7,
    category: 'noise_complaint',
    isEarlyWarning: true,
  },
  {
    content: 'I understand your frustration, Emma. I\'ve spoken with the upstairs tenant and they\'ve agreed to be more mindful of noise levels, especially after 10 PM. I\'ll also be installing additional soundproofing this weekend.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    readAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000),
    senderId: MANAGER1_ID,
    receiverId: EMMA_ID,
    sentiment: 'POSITIVE',
    sentimentScore: 0.6,
    category: 'resolution',
    isEarlyWarning: false,
  },
  {
    content: 'Thank you so much for addressing this quickly! The noise has significantly decreased and I really appreciate the soundproofing work.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    senderId: EMMA_ID,
    receiverId: MANAGER1_ID,
    sentiment: 'POSITIVE',
    sentimentScore: 0.9,
    category: 'satisfaction',
    isEarlyWarning: false,
  },
  {
    content: 'The elevator has been out of service for 3 days now. This is really inconvenient for elderly residents and those with mobility issues. What\'s the timeline for repair?',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    readAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
    senderId: LISA_ID,
    receiverId: MANAGER2_ID,
    sentiment: 'NEGATIVE',
    sentimentScore: -0.5,
    category: 'accessibility',
    isEarlyWarning: true,
  },
  {
    content: 'I apologize for the inconvenience. The elevator repair company had to order a specialized part. The good news is it arrived this morning and repairs will be completed by end of day today.',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    readAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
    senderId: MANAGER2_ID,
    receiverId: LISA_ID,
    sentiment: 'POSITIVE',
    sentimentScore: 0.4,
    category: 'update',
    isEarlyWarning: false,
  },
  {
    content: 'Great! The elevator is working perfectly now. Thank you for keeping me updated throughout the process.',
    createdAt: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000),
    readAt: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
    senderId: LISA_ID,
    receiverId: MANAGER2_ID,
    sentiment: 'POSITIVE',
    sentimentScore: 0.8,
    category: 'satisfaction',
    isEarlyWarning: false,
  },
  {
    content: 'The water pressure in my shower has been getting weaker over the past month. It\'s now barely a trickle. Could someone take a look?',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    readAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
    senderId: JAMES_ID,
    receiverId: MANAGER1_ID,
    sentiment: 'NEGATIVE',
    sentimentScore: -0.4,
    category: 'plumbing',
    isEarlyWarning: true,
  },
  {
    content: 'I\'ll send a plumber to check your water pressure tomorrow morning. This could be a building-wide issue that we need to address.',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000),
    readAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    senderId: MANAGER1_ID,
    receiverId: JAMES_ID,
    sentiment: 'NEUTRAL',
    sentimentScore: 0.2,
    category: 'response',
    isEarlyWarning: false,
  },
  
  // General property messages (no maintenance request)
  {
    content: 'Reminder to all Sunrise Apartments residents: The quarterly maintenance check is scheduled for next Monday. We\'ll be inspecting smoke detectors, HVAC filters, and plumbing in all units. Please expect maintenance staff between 9am-4pm.',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    senderId: MANAGER1_ID,
    receiverId: JOHN_ID, // Broadcast message, but we need a receiver for the schema
    sentiment: 'NEUTRAL',
    sentimentScore: 0.0,
    category: 'announcement',
    isEarlyWarning: false,
  },
  {
    content: 'The building\'s internet service will be upgraded this weekend. There may be brief outages on Saturday between 2-4 PM. We apologize for any inconvenience.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    senderId: MANAGER2_ID,
    receiverId: EMMA_ID,
    sentiment: 'NEUTRAL',
    sentimentScore: -0.1,
    category: 'announcement',
    isEarlyWarning: false,
  },
  {
    content: 'Thank you for the internet upgrade! The new speed is fantastic and much more reliable than before.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    senderId: DAVID_ID,
    receiverId: MANAGER2_ID,
    sentiment: 'POSITIVE',
    sentimentScore: 0.8,
    category: 'satisfaction',
    isEarlyWarning: false,
  },
];