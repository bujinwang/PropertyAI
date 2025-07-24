import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { maintenanceService } from '../services/maintenance.service';

const prisma = new PrismaClient();

class MaintenanceController {
  async getAllMaintenanceRequests(req: Request, res: Response) {
    try {
      const maintenanceRequests = await maintenanceService.getAllMaintenanceRequests();
      res.status(200).json({ data: maintenanceRequests });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createMaintenanceRequest(req: Request, res: Response) {
    try {
      const maintenanceRequest = await prisma.maintenanceRequest.create({
        data: req.body,
      });
      res.status(201).json({ data: maintenanceRequest });
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

  async assignVendorToWorkOrder(req: Request, res: Response) {
    const { workOrderId, vendorId } = req.body;
    try {
      // First, remove any existing assignments for this work order
      await prisma.workOrderAssignment.deleteMany({
        where: { workOrderId },
      });

      // Then, create the new assignment
      const assignment = await prisma.workOrderAssignment.create({
        data: {
          workOrderId,
          vendorId,
        },
      });
      res.status(201).json(assignment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createWorkOrderFromRequest(req: Request, res: Response) {
    try {
      const { maintenanceRequestId } = req.body;
      const workOrder = await maintenanceService.createWorkOrderFromRequest(maintenanceRequestId);
      if (workOrder) {
        res.status(201).json(workOrder);
      } else {
        res.status(404).json({ message: 'Maintenance request not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // New: Batch endpoint for creating work orders from multiple requests
  async createWorkOrdersFromRequests(req: Request, res: Response) {
    try {
      const { maintenanceRequestIds } = req.body;
      if (!Array.isArray(maintenanceRequestIds) || maintenanceRequestIds.length === 0) {
        return res.status(400).json({ message: 'maintenanceRequestIds must be a non-empty array' });
      }
      const workOrders = await maintenanceService.createWorkOrdersFromRequests(maintenanceRequestIds);
      res.status(201).json(workOrders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new MaintenanceController();
