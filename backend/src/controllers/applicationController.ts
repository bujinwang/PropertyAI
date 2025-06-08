import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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
