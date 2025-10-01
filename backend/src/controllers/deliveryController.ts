
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import * as crypto from 'crypto';

export class DeliveryController {
  /**
   * Get all deliveries for the authenticated user's rental
   */
  async getDeliveries(req: Request, res: Response) {
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
        return res.json({ deliveries: [] });
      }

      const deliveries = await (prisma as any).delivery.findMany({
        where: { rentalId: activeLease.rentalId },
        include: {
          pickedUpBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ deliveries });
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      res.status(500).json({ error: 'Failed to fetch deliveries' });
    }
  }

  /**
   * Get a specific delivery by ID
   */
  async getDeliveryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const delivery = await (prisma as any).delivery.findFirst({
        where: { 
          id,
          OR: [
            { rental: { managerId: userId } },
            { rental: { ownerId: userId } },
            { rental: { Leases: { some: { tenantId: userId, status: 'ACTIVE' } } } }
          ]
        },
        include: {
          pickedUpBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          rental: {
            select: { id: true, title: true, address: true }
          },
          deliveryAccessLog: {
            orderBy: { accessTime: 'desc' },
            take: 10
          }
        }
      });

      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found' });
      }

      res.json({ delivery });
    } catch (error) {
      console.error('Error fetching delivery:', error);
      res.status(500).json({ error: 'Failed to fetch delivery' });
    }
  }

  /**
   * Create a new delivery tracking entry
   */
  async createDelivery(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { trackingNumber, carrier, sender, description, recipientName, recipientPhone, rentalId } = req.body;

      // Generate pickup code for delivered packages
      const pickupCode = crypto.randomBytes(3).toString('hex').toUpperCase();

      const delivery = await (prisma as any).delivery.create({
        data: {
          trackingNumber,
          carrier,
          sender,
          description,
          recipientName,
          recipientPhone,
          pickupCode,
          rentalId,
          status: 'IN_TRANSIT'
        },
        include: {
          rental: {
            select: { id: true, title: true, address: true }
          }
        }
      });

      res.status(201).json({ delivery });
    } catch (error) {
      console.error('Error creating delivery:', error);
      res.status(500).json({ error: 'Failed to create delivery' });
    }
  }

  /**
   * Update a delivery tracking entry
   */
  async updateDelivery(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Check if user has permission to update this delivery
      const existingDelivery = await (prisma as any).delivery.findFirst({
        where: {
          id,
          OR: [
            { rental: { managerId: userId } },
            { rental: { ownerId: userId } }
          ]
        },
        include: { rental: true }
      });
  
      if (!existingDelivery) {
        return res.status(403).json({ error: 'Access denied' });
      }
  
      const delivery = await (prisma as any).delivery.update({
        where: { id },
        data: updateData,
        include: {
          rental: {
            select: { id: true, title: true, address: true }
          },
          pickedUpBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });
  
      res.json({ delivery });
    } catch (error) {
      console.error('Error updating delivery:', error);
      res.status(500).json({ error: 'Failed to update delivery' });
    }
  }

  /**
   * Mark a delivery as picked up
   */
  async markAsPickedUp(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { pickupCode } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const delivery = await (prisma as any).delivery.findFirst({
        where: {
          id,
          pickupCode,
          status: 'DELIVERED'
        },
        include: { rental: true }
      });

      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found or invalid pickup code' });
      }

      // Check if user has permission
      const hasPermission = await prisma.rental.findFirst({
        where: {
          id: delivery.rentalId,
          OR: [
            { managerId: userId },
            { ownerId: userId },
            { Leases: { some: { tenantId: userId, status: 'ACTIVE' } } }
          ]
        }
      });

      if (!hasPermission) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedDelivery = await (prisma as any).delivery.update({
        where: { id },
        data: {
          status: 'PICKED_UP',
          pickedUpById: userId,
          pickedUpAt: new Date()
        },
        include: {
          pickedUpBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          rental: {
            select: { id: true, title: true, address: true }
          }
        }
      });

      res.json({ delivery: updatedDelivery });
    } catch (error) {
      console.error('Error marking delivery as picked up:', error);
      res.status(500).json({ error: 'Failed to mark delivery as picked up' });
    }
  }

  /**
   * Delete a delivery tracking entry
   */
  async deleteDelivery(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const delivery = await (prisma as any).delivery.findFirst({
        where: {
          id,
          OR: [
            { rental: { managerId: userId } },
            { rental: { ownerId: userId } }
          ]
        },
        include: { rental: true }
      });

      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found or access denied' });
      }

      await (prisma as any).delivery.delete({
        where: { id }
      });

      res.json({ message: 'Delivery deleted successfully' });
    } catch (error) {
      console.error('Error deleting delivery:', error);
      res.status(500).json({ error: 'Failed to delete delivery' });
    }
  }
}

export default DeliveryController;