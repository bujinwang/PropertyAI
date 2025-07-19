export interface EmergencyAlert {
  id: string;
  type: 'fire' | 'medical' | 'security' | 'maintenance' | 'weather' | 'other';
  title: string;
  description: string;
  location: {
    propertyId: string;
    propertyName: string;
    unitNumber?: string;
    address: string;
    coordinates?: [number, number];
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'in_progress' | 'resolved';
  timestamp: Date;
  reportedBy: {
    id: string;
    name: string;
    role: 'tenant' | 'staff' | 'system' | 'external';
    contact?: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    role: string;
    contact: string;
  };
  estimatedResolution?: Date;
  updates: AlertUpdate[];
  responseProtocol?: ResponseProtocol;
}

export interface AlertUpdate {
  id: string;
  timestamp: Date;
  message: string;
  updatedBy: {
    id: string;
    name: string;
    role: string;
  };
  status?: EmergencyAlert['status'];
  attachments?: string[];
}

export interface ResponseProtocol {
  id: string;
  name: string;
  steps: ResponseStep[];
  estimatedDuration: number; // in minutes
  requiredRoles: string[];
}

export interface ResponseStep {
  id: string;
  order: number;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedBy?: {
    id: string;
    name: string;
    timestamp: Date;
  };
  estimatedDuration: number; // in minutes
  dependencies?: string[]; // step IDs that must be completed first
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  department?: string;
  phone: string;
  email?: string;
  alternatePhone?: string;
  availability: {
    hours: string;
    timezone: string;
    onCall: boolean;
  };
  specialties: string[];
  priority: number; // 1 = highest priority
}

export interface EmergencyService {
  id: string;
  name: string;
  type: '911' | 'fire' | 'police' | 'medical' | 'utility' | 'other';
  phone: string;
  address?: string;
  jurisdiction: string;
  responseTime?: number; // average in minutes
}

export interface IncidentReport {
  id: string;
  alertId: string;
  reportedTo: EmergencyService[];
  reportTime: Date;
  reportedBy: {
    id: string;
    name: string;
  };
  incidentNumber?: string;
  status: 'pending' | 'submitted' | 'acknowledged' | 'closed';
  details: {
    description: string;
    injuries: boolean;
    propertyDamage: boolean;
    evacuationRequired: boolean;
    additionalInfo: string;
  };
  attachments: string[];
}

export interface AlertFilters {
  status?: EmergencyAlert['status'][];
  priority?: EmergencyAlert['priority'][];
  type?: EmergencyAlert['type'][];
  dateRange?: {
    start: Date;
    end: Date;
  };
  propertyId?: string;
  assignedTo?: string;
}

export interface AlertSortOptions {
  field: 'timestamp' | 'priority' | 'status' | 'type' | 'location';
  direction: 'asc' | 'desc';
}

// Real-time communication types
export interface ChatMessage {
  id: string;
  alertId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'voice' | 'image' | 'location' | 'quick_response';
  attachments?: string[];
  readBy: {
    userId: string;
    timestamp: Date;
  }[];
}

export interface QuickResponse {
  id: string;
  text: string;
  category: 'status' | 'request' | 'confirmation' | 'emergency';
  icon?: string;
}

export interface VoiceNote {
  id: string;
  alertId: string;
  senderId: string;
  senderName: string;
  audioUrl: string;
  duration: number; // in seconds
  timestamp: Date;
  transcription?: string;
}

// Notification types
export interface PushNotificationConfig {
  userId: string;
  alertTypes: EmergencyAlert['type'][];
  priorities: EmergencyAlert['priority'][];
  properties: string[]; // property IDs
  enabled: boolean;
  quietHours?: {
    start: string; // HH:mm format
    end: string;
    timezone: string;
  };
}

export interface NotificationDelivery {
  id: string;
  alertId: string;
  userId: string;
  method: 'push' | 'sms' | 'email' | 'call';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  timestamp: Date;
  retryCount: number;
  error?: string;
}

// Emergency Services Integration types
export interface EmergencyServicesReport {
  id: string;
  alertId: string;
  serviceType: '911' | 'fire' | 'police' | 'medical' | 'utility';
  reportedAt: Date;
  reportedBy: {
    id: string;
    name: string;
    role: string;
    contact: string;
  };
  incidentDetails: {
    type: EmergencyAlert['type'];
    description: string;
    location: {
      address: string;
      coordinates?: [number, number];
      propertyName: string;
      unitNumber?: string;
      accessInstructions?: string;
    };
    severity: 'minor' | 'moderate' | 'severe' | 'critical';
    injuries: boolean;
    injuryCount?: number;
    propertyDamage: boolean;
    evacuationRequired: boolean;
    hazardousConditions: boolean;
    additionalInfo: string;
  };
  communicationStatus: EmergencyServicesCommunicationStatus;
  referenceNumber?: string;
  dispatchedUnits?: DispatchedUnit[];
  estimatedArrival?: Date;
  actualArrival?: Date;
  status: 'pending' | 'dispatched' | 'en_route' | 'on_scene' | 'resolved' | 'cancelled';
  updates: EmergencyServicesUpdate[];
}

export interface EmergencyServicesCommunicationStatus {
  callConnected: boolean;
  callDuration?: number; // in seconds
  operatorId?: string;
  operatorName?: string;
  callbackNumber?: string;
  followUpRequired: boolean;
  communicationLog: CommunicationLogEntry[];
}

export interface CommunicationLogEntry {
  id: string;
  timestamp: Date;
  type: 'call_initiated' | 'call_connected' | 'information_provided' | 'callback_received' | 'status_update' | 'call_ended';
  message: string;
  operatorId?: string;
  duration?: number;
}

export interface DispatchedUnit {
  id: string;
  unitNumber: string;
  type: 'fire_truck' | 'ambulance' | 'police_car' | 'hazmat' | 'rescue' | 'other';
  personnel: number;
  estimatedArrival: Date;
  actualArrival?: Date;
  status: 'dispatched' | 'en_route' | 'on_scene' | 'returning' | 'available';
}

export interface EmergencyServicesUpdate {
  id: string;
  timestamp: Date;
  type: 'dispatch' | 'en_route' | 'arrival' | 'status_change' | 'completion';
  message: string;
  source: 'operator' | 'unit' | 'system';
  sourceId?: string;
}

export interface IncidentReportForm {
  alertId: string;
  serviceType: EmergencyServicesReport['serviceType'];
  incidentType: EmergencyAlert['type'];
  description: string;
  location: {
    address: string;
    propertyName: string;
    unitNumber?: string;
    accessInstructions?: string;
    coordinates?: [number, number];
  };
  severity: EmergencyServicesReport['incidentDetails']['severity'];
  injuries: boolean;
  injuryCount?: number;
  injuryDetails?: string;
  propertyDamage: boolean;
  damageDescription?: string;
  evacuationRequired: boolean;
  evacuationDetails?: string;
  hazardousConditions: boolean;
  hazardDescription?: string;
  witnessInfo?: string;
  additionalInfo?: string;
  reporterContact: {
    name: string;
    phone: string;
    email?: string;
    role: string;
  };
}