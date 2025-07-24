import { PrismaClient } from '@prisma/client';
import { pushNotificationService } from './pushNotification.service';

const prisma = new PrismaClient();

class ManualReviewService {
  async getApplicationsForReview() {
    return prisma.application.findMany({ where: { status: 'PENDING' } });
  }

  async approveApplication(applicationId: string) {
    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'ACCEPTED' },
      include: { applicant: { include: { devices: true } } },
    });

    const applicant = application.applicant;
    if (applicant.devices.length > 0) {
      const { pushToken, platform } = applicant.devices[0];
      const title = 'Application Approved!';
      const body = 'Congratulations! Your rental application has been approved.';
      if (platform === 'ios') {
        await pushNotificationService.sendIOSNotification(pushToken, title, body);
      } else {
        await pushNotificationService.sendAndroidNotification(pushToken, title, body);
      }
    }

    return application;
  }

  async rejectApplication(applicationId: string) {
    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'REJECTED' },
      include: { applicant: { include: { devices: true } } },
    });

    const applicant = application.applicant;
    if (applicant.devices.length > 0) {
      const { pushToken, platform } = applicant.devices[0];
      const title = 'Application Update';
      const body = 'We regret to inform you that your application has been rejected.';
      if (platform === 'ios') {
        await pushNotificationService.sendIOSNotification(pushToken, title, body);
      } else {
        await pushNotificationService.sendAndroidNotification(pushToken, title, body);
      }
    }

    return application;
  }
}

export default new ManualReviewService();
