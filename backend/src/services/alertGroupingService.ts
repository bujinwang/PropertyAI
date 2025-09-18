import { PrismaClient } from '@prisma/client';
import { AlertGroupType, AlertPriority } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateAlertGroupData {
  groupType: AlertGroupType;
  priority: AlertPriority;
  propertyId: string;
  alertCount?: number;
}

export interface UpdateAlertGroupData {
  groupType?: AlertGroupType;
  priority?: AlertPriority;
  alertCount?: number;
}

export class AlertGroupingService {
  /**
   * Create a new alert group
   */
  async createAlertGroup(data: CreateAlertGroupData) {
    try {
      // Check if alert group already exists for this property, type, and priority
      const existingGroup = await prisma.alertGroup.findUnique({
        where: {
          groupType_priority_propertyId: {
            groupType: data.groupType,
            priority: data.priority,
            propertyId: data.propertyId,
          },
        },
      });

      if (existingGroup) {
        // Update the existing group's alert count
        return await prisma.alertGroup.update({
          where: { id: existingGroup.id },
          data: {
            alertCount: (existingGroup.alertCount || 0) + (data.alertCount || 1),
            updatedAt: new Date(),
          },
          include: {
            property: true,
          },
        });
      }

      // Create new alert group
      return await prisma.alertGroup.create({
        data: {
          groupType: data.groupType,
          priority: data.priority,
          propertyId: data.propertyId,
          alertCount: data.alertCount || 1,
        },
        include: {
          property: true,
        },
      });
    } catch (error) {
      console.error('Error creating alert group:', error);
      throw new Error('Failed to create alert group');
    }
  }

  /**
   * Get alert group by ID
   */
  async getAlertGroupById(id: string) {
    try {
      return await prisma.alertGroup.findUnique({
        where: { id },
        include: {
          property: true,
        },
      });
    } catch (error) {
      console.error('Error fetching alert group:', error);
      throw new Error('Failed to fetch alert group');
    }
  }

  /**
   * Get all alert groups for a property
   */
  async getAlertGroupsByProperty(propertyId: string) {
    try {
      return await prisma.alertGroup.findMany({
        where: { propertyId },
        include: {
          property: true,
        },
        orderBy: [
          { priority: 'desc' },
          { updatedAt: 'desc' },
        ],
      });
    } catch (error) {
      console.error('Error fetching alert groups by property:', error);
      throw new Error('Failed to fetch alert groups');
    }
  }

  /**
   * Get alert groups by type and priority
   */
  async getAlertGroupsByTypeAndPriority(
    groupType: AlertGroupType,
    priority: AlertPriority
  ) {
    try {
      return await prisma.alertGroup.findMany({
        where: {
          groupType,
          priority,
        },
        include: {
          property: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error fetching alert groups by type and priority:', error);
      throw new Error('Failed to fetch alert groups');
    }
  }

  /**
   * Update alert group
   */
  async updateAlertGroup(id: string, data: UpdateAlertGroupData) {
    try {
      return await prisma.alertGroup.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          property: true,
        },
      });
    } catch (error) {
      console.error('Error updating alert group:', error);
      throw new Error('Failed to update alert group');
    }
  }

  /**
   * Increment alert count for a group
   */
  async incrementAlertCount(id: string, incrementBy: number = 1) {
    try {
      return await prisma.alertGroup.update({
        where: { id },
        data: {
          alertCount: {
            increment: incrementBy,
          },
          updatedAt: new Date(),
        },
        include: {
          property: true,
        },
      });
    } catch (error) {
      console.error('Error incrementing alert count:', error);
      throw new Error('Failed to increment alert count');
    }
  }

  /**
   * Decrement alert count for a group
   */
  async decrementAlertCount(id: string, decrementBy: number = 1) {
    try {
      const alertGroup = await prisma.alertGroup.findUnique({
        where: { id },
      });

      if (!alertGroup) {
        throw new Error('Alert group not found');
      }

      const newCount = Math.max(0, (alertGroup.alertCount || 0) - decrementBy);

      return await prisma.alertGroup.update({
        where: { id },
        data: {
          alertCount: newCount,
          updatedAt: new Date(),
        },
        include: {
          property: true,
        },
      });
    } catch (error) {
      console.error('Error decrementing alert count:', error);
      throw new Error('Failed to decrement alert count');
    }
  }

  /**
   * Delete alert group
   */
  async deleteAlertGroup(id: string) {
    try {
      return await prisma.alertGroup.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting alert group:', error);
      throw new Error('Failed to delete alert group');
    }
  }

  /**
   * Get alert groups statistics
   */
  async getAlertGroupsStats(propertyId?: string) {
    try {
      const whereClause = propertyId ? { propertyId } : {};

      const stats = await prisma.alertGroup.groupBy({
        by: ['groupType', 'priority'],
        where: whereClause,
        _count: {
          id: true,
        },
        _sum: {
          alertCount: true,
        },
      });

      return stats;
    } catch (error) {
      console.error('Error fetching alert groups stats:', error);
      throw new Error('Failed to fetch alert groups statistics');
    }
  }

  /**
   * Clean up empty alert groups (alertCount = 0)
   */
  async cleanupEmptyAlertGroups() {
    try {
      const result = await prisma.alertGroup.deleteMany({
        where: {
          alertCount: 0,
        },
      });

      return result;
    } catch (error) {
      console.error('Error cleaning up empty alert groups:', error);
      throw new Error('Failed to cleanup empty alert groups');
    }
  }

  /**
   * Get high priority alert groups
   */
  async getHighPriorityAlertGroups(limit: number = 10) {
    try {
      return await prisma.alertGroup.findMany({
        where: {
          OR: [
            { priority: AlertPriority.CRITICAL },
            { priority: AlertPriority.HIGH },
          ],
        },
        include: {
          property: true,
        },
        orderBy: [
          { priority: 'desc' },
          { alertCount: 'desc' },
          { updatedAt: 'desc' },
        ],
        take: limit,
      });
    } catch (error) {
      console.error('Error fetching high priority alert groups:', error);
      throw new Error('Failed to fetch high priority alert groups');
    }
  }
}

export default new AlertGroupingService();
