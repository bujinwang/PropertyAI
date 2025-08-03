import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { pushNotificationService } from '../services/pushNotification.service';

const prisma = new PrismaClient();

class ApplicationController {
  async getAllApplications(req: Request, res: Response) {
    try {
      const applications = await prisma.application.findMany();
      res.status(200).json(applications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createApplication(req: Request, res: Response) {
    try {
      const application = await prisma.application.create({ data: req.body });

      // Send a push notification to the applicant
      const applicant = await prisma.user.findUnique({ 
        where: { id: application.applicantId },
        include: {
          Device: true
        }
      });
      if (applicant?.Device && applicant.Device.length > 0) {
        const device = applicant.Device[0];
        const pushToken = device.pushToken || '';
        const platform = device.deviceType || 'android';
        const title = 'Application Received';
        const body = 'Your application has been received and is under review.';
        if (platform === 'ios') {
          await pushNotificationService.sendIOSNotification(pushToken, title, body);
        } else {
          await pushNotificationService.sendAndroidNotification(pushToken, title, body);
        }
      }

      res.status(201).json(application);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getApplicationById(req: Request, res: Response) {
    try {
      const application = await prisma.application.findUnique({
        where: { id: req.params.id },
      });
      if (application) {
        res.status(200).json(application);
      } else {
        res.status(404).json({ message: 'Application not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateApplication(req: Request, res: Response) {
    try {
      const application = await prisma.application.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.status(200).json(application);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteApplication(req: Request, res: Response) {
    try {
      await prisma.application.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ApplicationController();
