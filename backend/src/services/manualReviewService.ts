import { PrismaClient, ApplicationStatus } from '@prisma/client';
import { pushNotificationService } from './pushNotification.service';
import { Prisma } from '@prisma/client';

type ApplicationWithApplicantAndDevices = Prisma.ApplicationGetPayload<{
  include: { applicant: { include: { devices: true } } };
}>;

const prisma = new PrismaClient();

class ManualReviewService {
  async getApplicationsForReview() {
    return prisma.application.findMany({ where: { status: 'PENDING' } });
  }


  async approveApplication(applicationId: string) {
    const application: ApplicationWithApplicantAndDevices = await prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.APPROVED },
      include: { applicant: { include: { devices: true } } },
    });

    const applicant = await prisma.user.findUnique({
      where: { id: application.applicantId },
      include: { devices: true },
    });

    if (applicant && applicant.devices.length > 0) {
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
    const application: ApplicationWithApplicantAndDevices = await prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.REJECTED },
      include: { applicant: { include: { devices: true } } },
    });

    const applicant = await prisma.user.findUnique({
      where: { id: application.applicantId },
      include: { devices: true },
    });

    if (applicant && applicant.devices.length > 0) {
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
