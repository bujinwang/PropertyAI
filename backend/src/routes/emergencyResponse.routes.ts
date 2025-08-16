import express from 'express';
import * as emergencyResponseController from '../controllers/emergencyResponse.controller';

const router = express.Router();

// Note: WebSocket endpoint is handled by EmergencyWebSocketService, not Express routes
// The WebSocket server is available at /api/emergency-response/ws

// Alert management routes
router.get('/alerts', emergencyResponseController.getAlerts);
router.get('/alerts/:id', emergencyResponseController.getAlert);
router.patch('/alerts/:id/status', emergencyResponseController.updateAlertStatus);
router.patch('/alerts/:id/assign', emergencyResponseController.assignAlert);

// Emergency contacts routes
router.get('/contacts', emergencyResponseController.getEmergencyContacts);
router.post('/contacts', emergencyResponseController.createEmergencyContact);
router.patch('/contacts/:id', emergencyResponseController.updateEmergencyContact);
router.delete('/contacts/:id', emergencyResponseController.deleteEmergencyContact);

// Response protocols routes
router.get('/protocols', emergencyResponseController.getResponseProtocols);
router.patch('/protocols/:protocolId/steps/:stepId', emergencyResponseController.updateResponseStep);

// Incident reporting routes
router.post('/incidents', emergencyResponseController.createIncidentReport);

// Emergency services integration routes
router.post('/emergency-services/report', emergencyResponseController.reportToEmergencyServices);
router.get('/emergency-services/report/:alertId', emergencyResponseController.getEmergencyServicesReport);
router.patch('/emergency-services/report/:reportId/status', emergencyResponseController.updateEmergencyServicesStatus);
router.post('/emergency-services/report/:reportId/communication', emergencyResponseController.addCommunicationLogEntry);

// Communication routes
router.get('/alerts/:alertId/chat', emergencyResponseController.getChatMessages);
router.post('/alerts/:alertId/chat', emergencyResponseController.sendChatMessage);
router.post('/alerts/:alertId/voice', emergencyResponseController.uploadVoiceNote);

// Notification configuration routes
router.put('/notifications/config', emergencyResponseController.updateNotificationConfig);
router.get('/notifications/config/:userId', emergencyResponseController.getNotificationConfig);

export default router;