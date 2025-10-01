
import { Request, Response } from 'express';
import { prisma } from '../config/database';

export class VisitorAccessController {
  /**
   * Log visitor access (entry/exit)
   */
  async logVisitorAccess(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { visitorId, accessType, location, verifiedBy, notes } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Verify the visitor exists and is approved
      const visitor = await (prisma as any).visitor.findFirst({
        where: { 
          id: visitorId,
          status: 'APPROVED'
        },
        include: { rental: true }
      });

      if (!visitor) {
        return res.status(404).json({ error: 'Visitor not found or not approved' });
      }

      // Check if user has permission to log access for this rental
      const hasPermission = await prisma.rental.findFirst({
        where: {
          id: visitor.rentalId,
          OR: [
            { managerId: userId },
            { ownerId: userId }
          ]
        }
      });

      if (!hasPermission) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const accessLog = await (prisma as any).visitorAccessLog.create({
        data: {
          visitorId,
          accessType,
          location,
          verifiedBy,
          notes
        },
        include: {
          visitor: {
            select: { id: true, name: true, accessCode: true }
          }
        }
      });

      res.status(201).json({ accessLog });
    } catch (error) {
      console.error('Error logging visitor access:', error);
      res.status(500).json({ error: 'Failed to log visitor access' });
    }
  }

  /**
   * Log delivery access
   */
  async logDeliveryAccess(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { deliveryId, accessType, location, verifiedBy, notes } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Verify the delivery exists and is delivered
      const delivery = await (prisma as any).delivery.findFirst({
        where: { 
          id: deliveryId,
          status: 'DELIVERED'
        },
        include: { rental: true }
      });

      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found or not delivered' });
      }

      // Check if user has permission to log access for this rental
      const hasPermission = await prisma.rental.findFirst({
        where: {
          id: delivery.rentalId,
          OR: [
            { managerId: userId },
            { ownerId: userId }
          ]
        }
      });

      if (!hasPermission) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const accessLog = await (prisma as any).deliveryAccessLog.create({
        data: {
          deliveryId,
          accessType,
          location,
          verifiedBy,
          notes
        },
        include: {
          delivery: {
            select: { id: true, trackingNumber: true, pickupCode: true }
          }
        }
      });

      res.status(201).json({ accessLog });
    } catch (error) {
      console.error('Error logging delivery access:', error);
      res.status(500).json({ error: 'Failed to log delivery access' });
    }
  }

  /**
   * Get visitor access logs
   */
  async getVisitorAccessLogs(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { visitorId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Verify the visitor exists and user has access
      const visitor = await (prisma as any).visitor.findFirst({
        where: {
          id: visitorId,
          OR: [
            { requestedById: userId },
            { rental: { managerId: userId } },
            { rental: { ownerId: userId } }
          ]
        }
      });

      if (!visitor) {
        return res.status(404).json({ error: 'Visitor not found or access denied' });
      }

      const accessLogs = await (prisma as any).visitorAccessLog.findMany({
        where: { visitorId },
        orderBy: { accessTime: 'desc' },
        take: 50,
        include: {
          verifiedBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      res.json({ accessLogs });
    } catch (error) {
      console.error('Error fetching visitor access logs:', error);
      res.status(500).json({ error: 'Failed to fetch access logs' });
    }
  }

  /**
   * Get delivery access logs
   */
  async getDeliveryAccessLogs(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { deliveryId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Verify the delivery exists and user has access
      const delivery = await (prisma as any).delivery.findFirst({
        where: {
          id: deliveryId,
          OR: [
            { rental: { managerId: userId } },
            { rental: { ownerId: userId } },
            { rental: { leases: { some: { tenantId: userId, status: 'ACTIVE' } } } }
          ]
        }
      });

      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found or access denied' });
      }

      const accessLogs = await (prisma as any).deliveryAccessLog.findMany({
        where: { deliveryId },
        orderBy: { accessTime: 'desc' },
        take: 50,
        include: {
          verifiedBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      res.json({ accessLogs });
    } catch (error) {
      console.error('Error fetching delivery access logs:', error);
      res.status(500).json({ error: 'Failed to fetch access logs' });
    }
  }
}

export default VisitorAccessController;