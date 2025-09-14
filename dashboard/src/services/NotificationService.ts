import axios from 'axios';
import logger from '../utils/logger';

// Mock email/SMS - in prod, integrate with Twilio/SendGrid
export const sendNotification = async (to: string, type: 'email' | 'sms', message: string) => {
  logger.info('Notification sent', { to, type, message });
  // Mock API call
  return { success: true, id: 'notif-123' };
};

export const notifyOwner = async (ownerId: string, applicationId: string, status: string) => {
  const message = `New application ${applicationId} for review - Status: ${status}`;
  return await sendNotification(ownerId, 'email', message);
};

export const notifyTenant = async (tenantId: string, reportId: string, riskLevel: string) => {
  const message = `Screening complete - Risk level: ${riskLevel}. Report ID: ${reportId}`;
  return await sendNotification(tenantId, 'sms', message);
};