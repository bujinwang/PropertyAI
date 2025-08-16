import { 
  EmergencyAlert, 
  AlertFilters, 
  AlertSortOptions, 
  EmergencyContact,
  ResponseProtocol,
  IncidentReport,
  ChatMessage,
  VoiceNote,
  PushNotificationConfig,
  EmergencyServicesReport,
  IncidentReportForm,
  CommunicationLogEntry
} from '../types/emergency-response';

import api from './api';

export interface EmergencyAlert {
  id: string;
  type: 'fire' | 'medical' | 'security' | 'weather' | 'evacuation' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'in_progress' | 'resolved' | 'cancelled';
  title: string;
  description: string;
  location: {
    building?: string;
    floor?: string;
    room?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  affectedAreas: string[];
  estimatedAffectedPeople: number;
  reportedBy: {
    id: string;
    name: string;
    role: string;
    contactInfo: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    role: string;
    contactInfo: string;
  };
  responseTeam: Array<{
    id: string;
    name: string;
    role: string;
    status: 'assigned' | 'en_route' | 'on_scene' | 'available';
    contactInfo: string;
  }>;
  timeline: Array<{
    timestamp: Date;
    action: string;
    performedBy: string;
    details?: string;
  }>;
  resources: Array<{
    type: string;
    quantity: number;
    status: 'requested' | 'dispatched' | 'on_scene' | 'deployed';
  }>;
  communicationLog: Array<{
    timestamp: Date;
    type: 'internal' | 'external' | 'public';
    message: string;
    sender: string;
    recipients: string[];
  }>;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedBy: string;
    uploadedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  estimatedResolutionTime?: Date;
  updates: Array<{
    id: string;
    timestamp: Date;
    message: string;
    userId: string;
    type: 'status_change' | 'assignment' | 'comment' | 'escalation';
  }>;
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  department: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  availability: {
    schedule: string;
    currentStatus: 'available' | 'busy' | 'off_duty' | 'emergency_only';
  };
  specializations: string[];
  location: string;
  priority: number;
  isActive: boolean;
  lastContacted?: Date;
  responseTime?: number; // in minutes
}

export interface ResponseProtocol {
  id: string;
  name: string;
  alertType: string;
  priority: string;
  steps: Array<{
    order: number;
    action: string;
    responsible: string;
    timeframe: string;
    required: boolean;
  }>;
  resources: Array<{
    type: string;
    quantity: number;
    location: string;
  }>;
  contacts: string[]; // Contact IDs
  escalationRules: Array<{
    condition: string;
    action: string;
    timeframe: string;
  }>;
  isActive: boolean;
  lastUpdated: Date;
  version: string;
}

export interface IncidentReport {
  id: string;
  alertId?: string;
  type: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  title: string;
  description: string;
  location: {
    building: string;
    floor?: string;
    room?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  reportedBy: {
    id: string;
    name: string;
    role: string;
    contactInfo: string;
  };
  witnesses: Array<{
    name: string;
    contactInfo: string;
    statement: string;
  }>;
  injuries: Array<{
    personName: string;
    injuryType: string;
    severity: string;
    medicalAttention: boolean;
    hospitalTransport: boolean;
  }>;
  propertyDamage: {
    estimated: boolean;
    amount?: number;
    description: string;
    photos: string[];
  };
  emergencyServices: Array<{
    service: string;
    contacted: boolean;
    arrivalTime?: Date;
    departureTime?: Date;
    reportNumber?: string;
  }>;
  timeline: Array<{
    timestamp: Date;
    event: string;
    details: string;
  }>;
  followUpActions: Array<{
    action: string;
    responsible: string;
    dueDate: Date;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedBy: string;
    uploadedAt: Date;
  }>;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  reviewedBy?: {
    id: string;
    name: string;
    reviewedAt: Date;
    comments?: string;
  };
}

export interface EmergencyService {
  id: string;
  name: string;
  type: 'fire' | 'police' | 'medical' | 'utility' | 'environmental' | 'other';
  contactInfo: {
    phone: string;
    emergencyPhone?: string;
    email?: string;
    address: string;
  };
  serviceArea: string[];
  capabilities: string[];
  responseTime: {
    average: number; // in minutes
    priority: number; // in minutes for high priority
  };
  availability: {
    schedule: string;
    currentStatus: 'available' | 'busy' | 'unavailable';
  };
  isActive: boolean;
  lastContacted?: Date;
  contractInfo?: {
    contractNumber: string;
    expirationDate: Date;
    contactPerson: string;
  };
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'voice' | 'public_announcement' | 'social_media';
  alertType: string;
  priority: string;
  subject?: string;
  content: string;
  variables: string[]; // Available template variables
  recipients: {
    internal: string[]; // Contact IDs
    external: string[]; // External contact info
    public: boolean;
  };
  isActive: boolean;
  lastUsed?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationConfig {
  id: string;
  userId: string;
  alertTypes: string[];
  priorities: string[];
  methods: Array<{
    type: 'email' | 'sms' | 'push' | 'voice';
    enabled: boolean;
    contactInfo: string;
  }>;
  schedule: {
    enabled: boolean;
    timeZone: string;
    workingHours: {
      start: string;
      end: string;
      days: string[];
    };
    emergencyOverride: boolean;
  };
  escalation: {
    enabled: boolean;
    timeframe: number; // minutes
    method: string;
    contact: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class EmergencyResponseService {
  private baseUrl: string;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }

  // WebSocket connection methods
  connectWebSocket(): void {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No authentication token found for WebSocket connection');
        return;
      }

      // Convert HTTP URL to WebSocket URL and add token as query parameter
      const wsUrl = this.baseUrl.replace('http', 'ws') + '/emergency-response/ws?token=' + encodeURIComponent(token);
      
      console.log('Connecting to emergency WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Emergency WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Subscribe to alerts and status updates
        this.sendMessage({
          type: 'subscribe_alerts'
        });
        
        this.sendMessage({
          type: 'subscribe_status'
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Emergency WebSocket message received:', message);
          
          // Handle specific message types
          const handler = this.messageHandlers.get(message.type);
          if (handler) {
            handler(message.data);
          }
          
          // Handle heartbeat
          if (message.type === 'heartbeat') {
            this.sendMessage({
              type: 'heartbeat_response',
              timestamp: new Date()
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Emergency WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('Emergency WebSocket connection closed');
        this.ws = null;
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          setTimeout(() => {
            this.connectWebSocket();
          }, this.reconnectInterval * this.reconnectAttempts);
        }
      };
    } catch (error) {
      console.error('Error connecting to emergency WebSocket:', error);
    }
  }

  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  onWebSocketMessage(type: string, handler: (data: any) => void): () => void {
    this.messageHandlers.set(type, handler);
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(type);
    };
  }

  // Method for the hook to connect to alerts
  connectToAlerts(onNewAlert: (alert: EmergencyAlert) => void, onAlertUpdate: (update: any) => void): WebSocket {
    // Set up message handlers
    this.onWebSocketMessage('emergency_alert_created', onNewAlert);
    this.onWebSocketMessage('emergency_alert_updated', onAlertUpdate);
    this.onWebSocketMessage('emergency_status_changed', onAlertUpdate);
    
    // Connect WebSocket if not already connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connectWebSocket();
    }
    
    // Return a mock WebSocket object for the hook
    return {
      onopen: null,
      onclose: null,
      onerror: null,
      close: () => this.disconnectWebSocket(),
      readyState: this.ws?.readyState || WebSocket.CONNECTING
    } as WebSocket;
  }

  // API methods - using consistent api service
  async getAlerts(filters?: any, sort?: any): Promise<EmergencyAlert[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) {
      params.append('status', Array.isArray(filters.status) ? filters.status.join(',') : filters.status);
    }
    if (filters?.type) {
      params.append('type', Array.isArray(filters.type) ? filters.type.join(',') : filters.type);
    }
    if (filters?.priority) {
      params.append('priority', Array.isArray(filters.priority) ? filters.priority.join(',') : filters.priority);
    }
    if (sort?.field) {
      params.append('sortField', sort.field);
    }
    if (sort?.direction) {
      params.append('sortDirection', sort.direction);
    }

    const response = await api.get(`/emergency-response/alerts?${params.toString()}`);
    return response.data;
  }

  async getAlert(alertId: string): Promise<EmergencyAlert> {
    const response = await api.get(`/emergency-response/alerts/${alertId}`);
    return response.data;
  }

  async updateAlertStatus(alertId: string, status: EmergencyAlert['status'], message?: string): Promise<EmergencyAlert> {
    const response = await api.patch(`/emergency-response/alerts/${alertId}/status`, {
      status,
      message
    });
    return response.data;
  }

  async assignAlert(alertId: string, assigneeId: string): Promise<EmergencyAlert> {
    const response = await api.patch(`/emergency-response/alerts/${alertId}/assign`, {
      assigneeId
    });
    return response.data;
  }

  // Emergency contacts
  async getEmergencyContacts(search?: string): Promise<EmergencyContact[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const response = await api.get(`/emergency-response/contacts?${params.toString()}`);
    return response.data;
  }

  async createEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact> {
    const response = await api.post('/emergency-response/contacts', contact);
    return response.data;
  }

  async updateEmergencyContact(id: string, contact: Partial<EmergencyContact>): Promise<EmergencyContact> {
    const response = await api.patch(`/emergency-response/contacts/${id}`, contact);
    return response.data;
  }

  async deleteEmergencyContact(id: string): Promise<void> {
    await api.delete(`/emergency-response/contacts/${id}`);
  }

  // Response protocols
  async getResponseProtocols(): Promise<ResponseProtocol[]> {
    const response = await api.get('/emergency-response/protocols');
    return response.data;
  }

  async updateResponseStep(protocolId: string, stepId: string, completed: boolean): Promise<void> {
    await api.patch(`/emergency-response/protocols/${protocolId}/steps/${stepId}`, { completed });
  }

  // Incident reporting
  async createIncidentReport(report: Omit<IncidentReport, 'id' | 'reportTime' | 'status'>): Promise<IncidentReport> {
    const response = await api.post('/emergency-response/incidents', report);
    return {
      ...response.data,
      reportTime: new Date(response.data.reportTime)
    };
  }

  // Real-time communication
  async getChatMessages(alertId: string): Promise<ChatMessage[]> {
    const response = await api.get(`/emergency-response/alerts/${alertId}/chat`);
    return response.data.map((message: any) => ({
      ...message,
      timestamp: new Date(message.timestamp),
      readBy: message.readBy.map((read: any) => ({
        ...read,
        timestamp: new Date(read.timestamp)
      }))
    }));
  }

  async sendChatMessage(alertId: string, message: string, type: ChatMessage['type'] = 'text'): Promise<ChatMessage> {
    const response = await api.post(`/emergency-response/alerts/${alertId}/chat`, { message, type });
    return {
      ...response.data,
      timestamp: new Date(response.data.timestamp),
      readBy: response.data.readBy.map((read: any) => ({
        ...read,
        timestamp: new Date(read.timestamp)
      }))
    };
  }

  async uploadVoiceNote(alertId: string, audioBlob: Blob): Promise<VoiceNote> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-note.webm');

    const response = await api.post(`/emergency-response/alerts/${alertId}/voice`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      ...response.data,
      timestamp: new Date(response.data.timestamp)
    };
  }

  // Push notifications
  async updateNotificationConfig(config: PushNotificationConfig): Promise<void> {
    await api.put('/emergency-response/notifications/config', config);
  }

  async getNotificationConfig(userId: string): Promise<PushNotificationConfig> {
    const response = await api.get(`/emergency-response/notifications/config/${userId}`);
    return response.data;
  }

  // Emergency Services Integration
  async reportToEmergencyServices(reportData: IncidentReportForm): Promise<EmergencyServicesReport> {
    const response = await api.post('/emergency-response/emergency-services/report', reportData);

    const report = response.data;
    return {
      ...report,
      reportedAt: new Date(report.reportedAt),
      estimatedArrival: report.estimatedArrival ? new Date(report.estimatedArrival) : undefined,
      actualArrival: report.actualArrival ? new Date(report.actualArrival) : undefined,
      dispatchedUnits: report.dispatchedUnits?.map((unit: any) => ({
        ...unit,
        estimatedArrival: new Date(unit.estimatedArrival),
        actualArrival: unit.actualArrival ? new Date(unit.actualArrival) : undefined
      })),
      updates: report.updates.map((update: any) => ({
        ...update,
        timestamp: new Date(update.timestamp)
      })),
      communicationStatus: {
        ...report.communicationStatus,
        communicationLog: report.communicationStatus.communicationLog.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }))
      }
    };
  }

  async getEmergencyServicesReport(alertId: string): Promise<EmergencyServicesReport | null> {
    try {
      const response = await api.get(`/emergency-response/emergency-services/report/${alertId}`);
      
      const report = response.data;
      return {
        ...report,
        reportedAt: new Date(report.reportedAt),
        estimatedArrival: report.estimatedArrival ? new Date(report.estimatedArrival) : undefined,
        actualArrival: report.actualArrival ? new Date(report.actualArrival) : undefined,
        dispatchedUnits: report.dispatchedUnits?.map((unit: any) => ({
          ...unit,
          estimatedArrival: new Date(unit.estimatedArrival),
          actualArrival: unit.actualArrival ? new Date(unit.actualArrival) : undefined
        })),
        updates: report.updates.map((update: any) => ({
          ...update,
          timestamp: new Date(update.timestamp)
        })),
        communicationStatus: {
          ...report.communicationStatus,
          communicationLog: report.communicationStatus.communicationLog.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }))
        }
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async updateEmergencyServicesStatus(reportId: string, status: EmergencyServicesReport['status']): Promise<void> {
    await api.patch(`/emergency-response/emergency-services/report/${reportId}/status`, { status });
  }

  async addCommunicationLogEntry(reportId: string, entry: Omit<CommunicationLogEntry, 'id' | 'timestamp'>): Promise<void> {
    await api.post(`/emergency-response/emergency-services/report/${reportId}/communication`, entry);
  }
}

export const emergencyResponseService = new EmergencyResponseService();