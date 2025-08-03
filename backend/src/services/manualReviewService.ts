import { PrismaClient, ApplicationStatus } from '@prisma/client';
import { pushNotificationService } from './pushNotification.service';
import { Prisma } from '@prisma/client';

type ApplicationWithUserAndDevices = Prisma.ApplicationGetPayload<{
  include: { User: { include: { Device: true } } };
}>;

const prisma = new PrismaClient();

class ManualReviewService {
  async getApplicationsForReview() {
    return prisma.application.findMany({ where: { status: 'PENDING' } });
  }

  async approveApplication(applicationId: string) {
    const application: ApplicationWithUserAndDevices = await prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.APPROVED },
      include: { User: { include: { Device: true } } },
    });

    const applicant = application.User;

    if (applicant && applicant.Device.length > 0) {
      const device = applicant.Device[0];
      const pushToken = device.pushToken;
      const platform = device.os; // Use 'os' instead of 'platform'
      const title = 'Application Approved!';
      const body = 'Congratulations! Your rental application has been approved.';
      
      if (pushToken && platform) {
        if (platform.toLowerCase() === 'ios') {
          await pushNotificationService.sendIOSNotification(pushToken, title, body);
        } else {
          await pushNotificationService.sendAndroidNotification(pushToken, title, body);
        }
      }
    }

    return application;
  }

  async rejectApplication(applicationId: string) {
    const application: ApplicationWithUserAndDevices = await prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.REJECTED },
      include: { User: { include: { Device: true } } },
    });

    const applicant = application.User;

    if (applicant && applicant.Device.length > 0) {
      const device = applicant.Device[0];
      const pushToken = device.pushToken;
      const platform = device.os;
      const title = 'Application Update';
      const body = 'We regret to inform you that your application has been rejected.';
      
      if (pushToken && platform) {
        if (platform.toLowerCase() === 'ios') {
          await pushNotificationService.sendIOSNotification(pushToken, title, body);
        } else {
          await pushNotificationService.sendAndroidNotification(pushToken, title, body);
        }
      }
    }

    return application;
  }
}

export default new ManualReviewService();
