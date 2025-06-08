import { prisma } from '../config/database';
import { ServiceCommunication } from '../utils/serviceUtils';
import { handleDatabaseError } from '../utils/dbUtils';

interface MaintenanceRequestDto {
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  unitId: string;
  requestedById: string;
}

/**
 * Service for handling maintenance requests
 */
export class MaintenanceService {
  /**
   * Create a new maintenance request
   * This demonstrates inter-service communication by validating both property and user data
   */
  async createMaintenanceRequest(data: MaintenanceRequestDto) {
    try {
      // Validate that the unit exists
      const unit = await prisma.unit.findUnique({
        where: { id: data.unitId },
        select: { id: true, propertyId: true }
      });

      if (!unit) {
        throw new Error('Unit not found');
      }

      // Use inter-service communication to validate the property
      const property = await ServiceCommunication.validateProperty(unit.propertyId);
      
      if (!property.isActive) {
        throw new Error('Property is not active');
      }

      // Use inter-service communication to validate the user
      const user = await ServiceCommunication.validateUser(data.requestedById);
      
      if (!user.isActive) {
        throw new Error('User account is not active');
      }

      // Create the maintenance request
      const maintenanceRequest = await prisma.maintenanceRequest.create({
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: 'OPEN',
          unit: { connect: { id: data.unitId } },
          property: { connect: { id: unit.propertyId } },
          requestedBy: { connect: { id: data.requestedById } }
        },
        include: {
          unit: {
            select: {
              id: true,
              unitNumber: true
            }
          },
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              state: true
            }
          }
        }
      });

      // Use inter-service communication to get additional user details
      const requestedBy = await ServiceCommunication.getUserBasicInfo(data.requestedById);

      // Return the combined result
      return {
        ...maintenanceRequest,
        requestedBy
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Get a maintenance request by ID
   * Demonstrates combining data from multiple services
   */
  async getMaintenanceRequestById(id: string) {
    try {
      const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
        where: { id },
        include: {
          unit: {
            select: {
              id: true,
              unitNumber: true
            }
          },
          property: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!maintenanceRequest) {
        throw new Error('Maintenance request not found');
      }

      // Use inter-service communication to get property details
      const propertyDetails = await ServiceCommunication.getPropertyBasicInfo(maintenanceRequest.property.id);
      
      // Use inter-service communication to get user details
      const requestedBy = await ServiceCommunication.getUserBasicInfo(maintenanceRequest.requestedById);

      // Combine the data from different services
      return {
        ...maintenanceRequest,
        property: {
          ...maintenanceRequest.property,
          ...propertyDetails
        },
        requestedBy
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }
} 