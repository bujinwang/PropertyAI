
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
   * Ap
