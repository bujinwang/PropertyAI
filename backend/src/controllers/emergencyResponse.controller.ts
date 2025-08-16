import { Request, Response } from 'express';
import * as emergencyResponseService from '../services/emergencyResponse.service';

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status ? (req.query.status as string).split(',') : undefined,
      priority: req.query.priority ? (req.query.priority as string).split(',') : undefined,
      type: req.query.type ? (req.query.type as string).split(',') : undefined,
      propertyId: req.query.propertyId as string,
      assignedTo: req.query.assignedTo as string,
      dateRange: req.query.startDate && req.query.endDate ? {
        start: new Date(req.query.startDate as string),
        end: new Date(req.query.endDate as string)
      } : undefined
    };

    const sort = {
      field: req.query.sortField as string || 'priority',
      direction: req.query.sortDirection as 'asc' | 'desc' || 'desc'
    };

    const alerts = await emergencyResponseService.getAlerts(filters, sort);
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const alert = await emergencyResponseService.getAlert(id);
    res.json(alert);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAlertStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;
    await emergencyResponseService.updateAlertStatus(id, status, message);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const assignAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;
    await emergencyResponseService.assignAlert(id, assigneeId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmergencyContacts = async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    const contacts = await emergencyResponseService.getEmergencyContacts(search);
    res.json(contacts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createEmergencyContact = async (req: Request, res: Response) => {
  try {
    const contact = await emergencyResponseService.createEmergencyContact(req.body);
    res.status(201).json(contact);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEmergencyContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contact = await emergencyResponseService.updateEmergencyContact(id, req.body);
    res.json(contact);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEmergencyContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await emergencyResponseService.deleteEmergencyContact(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getResponseProtocols = async (req: Request, res: Response) => {
  try {
    const protocols = await emergencyResponseService.getResponseProtocols();
    res.json(protocols);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateResponseStep = async (req: Request, res: Response) => {
  try {
    const { protocolId, stepId } = req.params;
    const { completed } = req.body;
    await emergencyResponseService.updateResponseStep(protocolId, stepId, completed);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createIncidentReport = async (req: Request, res: Response) => {
  try {
    const report = await emergencyResponseService.createIncidentReport(req.body);
    res.status(201).json(report);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const reportToEmergencyServices = async (req: Request, res: Response) => {
  try {
    const report = await emergencyResponseService.reportToEmergencyServices(req.body);
    res.status(201).json(report);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmergencyServicesReport = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const report = await emergencyResponseService.getEmergencyServicesReport(alertId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEmergencyServicesStatus = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;
    await emergencyResponseService.updateEmergencyServicesStatus(reportId, status);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addCommunicationLogEntry = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    await emergencyResponseService.addCommunicationLogEntry(reportId, req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const sendChatMessage = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const message = await emergencyResponseService.sendChatMessage(alertId, req.body);
    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const messages = await emergencyResponseService.getChatMessages(alertId);
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadVoiceNote = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    // Handle file upload logic here
    const voiceNote = await emergencyResponseService.uploadVoiceNote(alertId, req.file);
    res.status(201).json(voiceNote);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateNotificationConfig = async (req: Request, res: Response) => {
  try {
    await emergencyResponseService.updateNotificationConfig(req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getNotificationConfig = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const config = await emergencyResponseService.getNotificationConfig(userId);
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// WebSocket upgrade handler
// Remove this function as WebSocket handling is done by EmergencyWebSocketService
// export const handleWebSocketUpgrade = async (req: Request, res: Response) => {
//   try {
//     // This endpoint is for WebSocket upgrade requests
//     // The actual WebSocket handling is done in the WebSocketService
//     res.status(200).json({ 
//       message: 'WebSocket endpoint available',
//       endpoint: '/api/emergency-response/ws'
//     });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// };