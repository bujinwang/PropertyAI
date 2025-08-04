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

class EmergencyResponseService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Alert management
  async getAlerts(filters?: AlertFilters, sort?: AlertSortOptions): Promise<EmergencyAlert[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.status) params.append('status', filters.status.join(','));
      if (filters.priority) params.append('priority', filters.priority.join(','));
      if (filters.type) params.append('type', filters.type.join(','));
      if (filters.propertyId) params.append('propertyId', filters.propertyId);
      if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange.start.toISOString());
        params.append('endDate', filters.dateRange.end.toISOString());
      }
    }

    if (sort) {
      params.append('sortField', sort.field);
      params.append('sortDirection', sort.direction);
    }

    const response = await fetch(`${this.baseUrl}/api/emergency-response/alerts?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch alerts');
    }

    const data = await response.json();
    return data.map((alert: any) => ({
      ...alert,
      timestamp: new Date(alert.timestamp),
      estimatedResolution: alert.estimatedResolution ? new Date(alert.estimatedResolution) : undefined,
      updates: alert.updates.map((update: any) => ({
        ...update,
        timestamp: new Date(update.timestamp)
      }))
    }));
  }

  async getAlert(id: string): Promise<EmergencyAlert> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/alerts/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch alert');
    }

    const alert = await response.json();
    return {
      ...alert,
      timestamp: new Date(alert.timestamp),
      estimatedResolution: alert.estimatedResolution ? new Date(alert.estimatedResolution) : undefined,
      updates: alert.updates.map((update: any) => ({
        ...update,
        timestamp: new Date(update.timestamp)
      }))
    };
  }

  async updateAlertStatus(id: string, status: EmergencyAlert['status'], message?: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/alerts/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, message }),
    });

    if (!response.ok) {
      throw new Error('Failed to update alert status');
    }
  }

  async assignAlert(id: string, assigneeId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/alerts/${id}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assigneeId }),
    });

    if (!response.ok) {
      throw new Error('Failed to assign alert');
    }
  }

  // Emergency contacts
  async getEmergencyContacts(search?: string): Promise<EmergencyContact[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const response = await fetch(`${this.baseUrl}/api/emergency-response/contacts?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch emergency contacts');
    }

    return response.json();
  }

  async createEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contact),
    });

    if (!response.ok) {
      throw new Error('Failed to create emergency contact');
    }

    return response.json();
  }

  async updateEmergencyContact(id: string, contact: Partial<EmergencyContact>): Promise<EmergencyContact> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/contacts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contact),
    });

    if (!response.ok) {
      throw new Error('Failed to update emergency contact');
    }

    return response.json();
  }

  async deleteEmergencyContact(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/contacts/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete emergency contact');
    }
  }

  // Response protocols
  async getResponseProtocols(): Promise<ResponseProtocol[]> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/protocols`);
    if (!response.ok) {
      throw new Error('Failed to fetch response protocols');
    }

    return response.json();
  }

  async updateResponseStep(protocolId: string, stepId: string, completed: boolean): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/protocols/${protocolId}/steps/${stepId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ completed }),
    });

    if (!response.ok) {
      throw new Error('Failed to update response step');
    }
  }

  // Incident reporting
  async createIncidentReport(report: Omit<IncidentReport, 'id' | 'reportTime' | 'status'>): Promise<IncidentReport> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      throw new Error('Failed to create incident report');
    }

    const incident = await response.json();
    return {
      ...incident,
      reportTime: new Date(incident.reportTime)
    };
  }

  // Real-time communication
  async getChatMessages(alertId: string): Promise<ChatMessage[]> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/alerts/${alertId}/chat`);
    if (!response.ok) {
      throw new Error('Failed to fetch chat messages');
    }

    const messages = await response.json();
    return messages.map((message: any) => ({
      ...message,
      timestamp: new Date(message.timestamp),
      readBy: message.readBy.map((read: any) => ({
        ...read,
        timestamp: new Date(read.timestamp)
      }))
    }));
  }

  async sendChatMessage(alertId: string, message: string, type: ChatMessage['type'] = 'text'): Promise<ChatMessage> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/alerts/${alertId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, type }),
    });

    if (!response.ok) {
      throw new Error('Failed to send chat message');
    }

    const chatMessage = await response.json();
    return {
      ...chatMessage,
      timestamp: new Date(chatMessage.timestamp),
      readBy: chatMessage.readBy.map((read: any) => ({
        ...read,
        timestamp: new Date(read.timestamp)
      }))
    };
  }

  async uploadVoiceNote(alertId: string, audioBlob: Blob): Promise<VoiceNote> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-note.webm');

    const response = await fetch(`${this.baseUrl}/api/emergency-response/alerts/${alertId}/voice`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload voice note');
    }

    const voiceNote = await response.json();
    return {
      ...voiceNote,
      timestamp: new Date(voiceNote.timestamp)
    };
  }

  // Push notifications
  async updateNotificationConfig(config: PushNotificationConfig): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/notifications/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to update notification config');
    }
  }

  async getNotificationConfig(userId: string): Promise<PushNotificationConfig> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/notifications/config/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch notification config');
    }

    return response.json();
  }

  // Emergency Services Integration
  async reportToEmergencyServices(reportData: IncidentReportForm): Promise<EmergencyServicesReport> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/emergency-services/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    if (!response.ok) {
      throw new Error('Failed to report to emergency services');
    }

    const report = await response.json();
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
    const response = await fetch(`${this.baseUrl}/api/emergency-response/emergency-services/report/${alertId}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch emergency services report');
    }

    const report = await response.json();
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

  async updateEmergencyServicesStatus(reportId: string, status: EmergencyServicesReport['status']): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/emergency-services/report/${reportId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update emergency services status');
    }
  }

  async addCommunicationLogEntry(reportId: string, entry: Omit<CommunicationLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/emergency-services/report/${reportId}/communication`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      throw new Error('Failed to add communication log entry');
    }
  }

  // WebSocket connection for real-time updates
  connectToAlerts(onAlert: (alert: EmergencyAlert) => void, onUpdate: (update: any) => void): WebSocket {
    const ws = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/api/emergency-response/ws`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'alert') {
        onAlert({
          ...data.alert,
          timestamp: new Date(data.alert.timestamp),
          estimatedResolution: data.alert.estimatedResolution ? new Date(data.alert.estimatedResolution) : undefined,
          updates: data.alert.updates.map((update: any) => ({
            ...update,
            timestamp: new Date(update.timestamp)
          }))
        });
      } else if (data.type === 'update') {
        onUpdate(data);
      }
    };

    return ws;
  }
}

export const emergencyResponseService = new EmergencyResponseService();