import { Request, Response } from 'express';
import BackgroundCheckService from '../services/backgroundCheckService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class BackgroundCheckController {
  async createCandidate(req: Request, res: Response) {
    try {
      const candidate = await BackgroundCheckService.createCandidate(req.body);
      res.status(201).json(candidate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createReport(req: Request, res: Response) {
    try {
      const report = await BackgroundCheckService.createReport(
        req.body.candidateId,
        req.body.package
      );
      await prisma.backgroundCheck.create({
        data: {
          applicationId: req.body.applicationId,
          vendor: 'checkr',
          vendorId: report.id,
          status: report.status,
        },
      });
      res.status(201).json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReport(req: Request, res: Response) {
    try {
      const report = await BackgroundCheckService.getReport(req.params.id);
      res.status(200).json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleWebhook(req: Request, res: Response) {
    try {
      const event = req.body;
      if (event.type === 'report.completed') {
        const report = event.data.object;
        await prisma.backgroundCheck.update({
          where: { vendorId: report.id },
          data: { status: report.status },
        });
      }
      res.status(200).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new BackgroundCheckController();
