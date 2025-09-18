
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import crypto from 'crypto';

export class VisitorController {
  /**
   * Get all visitors for the authenticated user's rental
   */
  async getVisitors(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user's active lease
      const activeLease = await prisma.lease.findFirst({
        where: { 
          tenantId: userId,
          status: 'ACTIVE'
        },
        include: { Rental: true }
      });

      if (!activeLease) {
        return res.json({ visitors: [] });
      }

      const visitors = await (prisma as any).visitor.findMany({
        where: { rentalId: activeLease.rentalId },
        include: {
          requestedBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          approvedBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { visitDate: 'desc' }
      });

      res.json({ visitors });
    } catch (error) {
      console.error('Error fetching visitors:', error);
      res.status(500).json({ error: 'Failed to fetch visitors' });
    }
  }

  /**
   * Get a specific visitor by ID
   */
  async getVisitorById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const visitor = await (prisma as any).visitor.findFirst({
        where: { 
          id,
          OR: [
            { requestedById: userId },
            { rental: { managerId: userId } },
            { rental: { ownerId: userId } }
          ]
        },
        include: {
          requestedBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          approvedBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          rental: {
            select: { id: true, title: true, address: true }
          },
          visitorAccessLog: {
            orderBy: { accessTime: 'desc' },
            take: 10
          }
        }
      });

      if (!visitor) {
        return res.status(404).json({ error: 'Visitor not found' });
      }

      res.json({ visitor });
    } catch (error) {
      console.error('Error fetching visitor:', error);
      res.status(500).json({ error: 'Failed to fetch visitor' });
    }
  }

  /**
   * Create a new visitor request
   */
  async createVisitor(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { name, email, phone, visitDate, visitTime, purpose, notes } = req.body;

      // Get user's active lease
      const activeLease = await prisma.lease.findFirst({
        where: { 
          tenantId: userId,
          status: 'ACTIVE'
        },
        include: { Rental: true }
      });

      if (!activeLease) {
        return res.status(400).json({ error: 'No active rental found for user' });
      }

      const visitor = await (prisma as any).visitor.create({
        data: {
          name,
          email,
          phone,
          visitDate: new Date(visitDate),
          visitTime,
          purpose,
          notes,
          requestedById: userId,
          rentalId: activeLease.rentalId
        },
        include: {
          requestedBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          rental: {
            select: { id: true, title: true, address: true, managerId: true }
          }
        }
      });

      res.status(201).json({ visitor });
    } catch (error) {
      console.error('Error creating visitor:', error);
      res.status(500).json({ error: 'Failed to create visitor' });
    }
  }

  /**
   * Approve a visitor request
   */
  async approveVisitor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Generate access code
      const accessCode = crypto.randomBytes(3).toString('hex').toUpperCase();

      const visitor = await (prisma as any).visitor.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: userId,
          accessCode,
          approvedAt: new Date()
        },
        include: {
          requestedBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          rental: {
            select: { id: true, title: true, address: true }
          }
        }
      });

      res.json({ visitor });
    } catch (error) {
      console.error('Error approving visitor:', error);
      res.status(500).json({ error: 'Failed to approve visitor' });
    }
  }

  /**
   * Deny a visitor request
   */
  async denyVisitor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { denialReason } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const visitor = await (prisma as any).visitor.update({
        where: { id },
        data: {
          status: 'DENIED',
          approvedById: userId,
          denialReason,
          approvedAt: new Date()
        },
        include: {
          requestedBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          rental: {
            select: { id: true, title: true, address: true }
          }
        }
      });

      res.json({ visitor });
    } catch (error) {
      console.error('Error denying visitor:', error);
      res.status(500).json({ error: 'Failed to deny visitor' });
    }
  }

  /**
   * Delete a visitor request
   */
  async deleteVisitor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const visitor = await (prisma as any).visitor.findFirst({
        where: {
          id,
          OR: [
            { requestedById: userId },
            { rental: { managerId: userId } },
            { rental: { ownerId: userId } }
          ]
        },
        include: { rental: true }
      });

      if (!visitor) {
        return res.status(404).json({ error: 'Visitor not found or access denied' });
      }

      await (prisma as any).visitor.delete({
        where: { id }
      });

      res.json({ message: 'Visitor request deleted successfully' });
    } catch (error) {
      console.error('Error deleting visitor:', error);
      res.status(500).json({ error: 'Failed to delete visitor' });
    }
  }
}
