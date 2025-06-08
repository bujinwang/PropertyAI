import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class LeaseController {
  async getAllLeases(req: Request, res: Response) {
    try {
      const leases = await prisma.lease.findMany();
      res.status(200).json(leases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createLease(req: Request, res: Response) {
    try {
      const lease = await prisma.lease.create({ data: req.body });
      res.status(201).json(lease);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getLeaseById(req: Request, res: Response) {
    try {
      const lease = await prisma.lease.findUnique({
        where: { id: req.params.id },
      });
      if (lease) {
        res.status(200).json(lease);
      } else {
        res.status(404).json({ message: 'Lease not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateLease(req: Request, res: Response) {
    try {
      const lease = await prisma.lease.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.status(200).json(lease);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteLease(req: Request, res: Response) {
    try {
      await prisma.lease.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new LeaseController();
