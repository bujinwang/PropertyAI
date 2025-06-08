import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class MaintenanceController {
  async getAllMaintenanceRequests(req: Request, res: Response) {
    try {
      const maintenanceRequests = await prisma.maintenanceRequest.findMany();
      res.status(200).json(maintenanceRequests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createMaintenanceRequest(req: Request, res: Response) {
    try {
      const maintenanceRequest = await prisma.maintenanceRequest.create({
        data: req.body,
      });
      res.status(201).json(maintenanceRequest);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMaintenanceRequestById(req: Request, res: Response) {
    try {
      const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
        where: { id: req.params.id },
      });
      if (maintenanceRequest) {
        res.status(200).json(maintenanceRequest);
      } else {
        res.status(404).json({ message: 'Maintenance request not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateMaintenanceRequest(req: Request, res: Response) {
    try {
      const maintenanceRequest = await prisma.maintenanceRequest.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.status(200).json(maintenanceRequest);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteMaintenanceRequest(req: Request, res: Response) {
    try {
      await prisma.maintenanceRequest.delete({
        where: { id: req.params.id },
      });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new MaintenanceController();
