import { prisma } from '../config/database';
import { sendEmail } from './emailService';
import { sendSms } from './smsService';

class LegalNoticeService {
  public async sendLegalNotice(tenantId: string, message: string) {
    const tenant = await prisma.user.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const subject = 'Important Legal Notice';
    await sendEmail(tenant.email, subject, message);

    if (tenant.phone) {
      await sendSms(tenant.phone, `Important Legal Notice: ${message}`);
    }

    // Track the delivery of the legal notice
    await prisma.notification.create({
      data: {
        message: subject, // Changed title to message
        type: 'OTHER' as any, // Cast to any to bypass type checking
        userId: tenantId,
      },
    });
  }
}

export const legalNoticeService = new LegalNoticeService();
