import { Request, Response } from 'express';
import { unitService, CreateUnitDto, UpdateUnitDto } from '../services/unitService';
import { PropertyService } from '../services/propertyService';
import { TenantService } from '../services/tenantService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const propertyService = new PropertyService();
const tenantService = new TenantService(prisma);

/**
 * Unit controller to handle HTTP requests related to unit management
 */
export class UnitController {
  /**
   * Create a new unit
   * @param req Request
   * @param res Response
   */
  async createUnit(req: Request, res: Response): Promise<Response> {
    try {
      const unitData: CreateUnitDto = req.body;
      
      // Validate required fields
      const requiredFields = ['unitNumber', 'propertyId'];
      const missingFields = requiredFields.filter(field => !unitData[field as keyof CreateUnitDto]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required fields',
          missingFields
        });
      }
      
      // Check if property exists
      try {
        const property = await propertyService.getPropertyById(unitData.propertyId);
        if (!property) {
          return res.status(404).json({
            status: 'error',
            message: 'Property not found'
          });
        }
      } catch (error) {
        return res.status(404).json({
          status: 'error',
          message: 'Property not found'
        });
      }
      
      const unit = await unitService.createUnit(unitData);
      
      return res.status(201).json({
        status: 'success',
        message: 'Unit created successfully',
        data: unit
      });
    } catch (error: any) {
      console.error('Error creating unit:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to create unit',
        code: error.code
      });
    }
  }
  
  /**
   * Get a unit by ID
   * @param req Request
   * @param res Response
   */
  async getUnitById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Unit ID is required'
        });
      }
      
      const unit = await unitService.getUnitById(id);
      
      if (!unit) {
        return res.status(404).json({
          status: 'error',
          message: 'Unit not found'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: unit
      });
    } catch (error: any) {
      console.error('Error getting unit:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to get unit',
        code: error.code
      });
    }
  }
  
  /**
   * Get units with filtering and pagination
   * @param req Request
   * @param res Response
   */
  async getUnits(req: Request, res: Response): Promise<Response> {
    try {
      const {
        unitNumber,
        propertyId,
        minBedrooms,
        maxBedrooms,
        minBathrooms,
        maxBathrooms,
        minRent,
        maxRent,
        isAvailable,
        tenantId,
        page = 1,
        limit = 10,
        sortField = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      // Build filter object
      const filters: any = {};
      
      if (unitNumber) filters.unitNumber = String(unitNumber);
      if (propertyId) filters.propertyId = String(propertyId);
      if (minBedrooms) filters.minBedrooms = parseInt(String(minBedrooms), 10);
      if (maxBedrooms) filters.maxBedrooms = parseInt(String(maxBedrooms), 10);
      if (minBathrooms) filters.minBathrooms = parseFloat(String(minBathrooms));
      if (maxBathrooms) filters.maxBathrooms = parseFloat(String(maxBathrooms));
      if (minRent) filters.minRent = parseFloat(String(minRent));
      if (maxRent) filters.maxRent = parseFloat(String(maxRent));
      if (isAvailable !== undefined) filters.isAvailable = isAvailable === 'true';
      if (tenantId) filters.tenantId = String(tenantId);
      
      // Validate sort order
      const validSortOrder = sortOrder === 'asc' || sortOrder === 'desc' 
        ? sortOrder 
        : 'desc';
      
      const result = await unitService.getUnits(
        filters,
        parseInt(String(page), 10),
        parseInt(String(limit), 10),
        String(sortField),
        validSortOrder as 'asc' | 'desc'
      );
      
      return res.status(200).json({
        status: 'success',
        data: result.units,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error: any) {
      console.error('Error getting units:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to get units',
        code: error.code
      });
    }
  }
  
  /**
   * Get units by property ID
   * @param req Request
   * @param res Response
   */
  async getUnitsByProperty(req: Request, res: Response): Promise<Response> {
    try {
      const { propertyId } = req.params;
      const { includeUnavailable = false } = req.query;
      
      if (!propertyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Property ID is required'
        });
      }
      
      // Check if property exists
      try {
        const property = await propertyService.getPropertyById(propertyId);
        if (!property) {
          return res.status(404).json({
            status: 'error',
            message: 'Property not found'
          });
        }
      } catch (error) {
        return res.status(404).json({
          status: 'error',
          message: 'Property not found'
        });
      }
      
      const units = await unitService.getUnitsByPropertyId(
        propertyId,
        includeUnavailable === 'true'
      );
      
      return res.status(200).json({
        status: 'success',
        data: units
      });
    } catch (error: any) {
      console.error('Error getting units by property:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to get units by property',
        code: error.code
      });
    }
  }
  
  /**
   * Update a unit
   * @param req Request
   * @param res Response
   */
  async updateUnit(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updateData: UpdateUnitDto = req.body;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Unit ID is required'
        });
      }
      
      // Check if unit exists
      const existingUnit = await unitService.getUnitById(id);
      
      if (!existingUnit) {
        return res.status(404).json({
          status: 'error',
          message: 'Unit not found'
        });
      }
      
      // If propertyId is being changed, check if new property exists
      if (updateData.propertyId && updateData.propertyId !== existingUnit.propertyId) {
        try {
          const property = await propertyService.getPropertyById(updateData.propertyId);
          if (!property) {
            return res.status(404).json({
              status: 'error',
              message: 'New property not found'
            });
          }
        } catch (error) {
          return res.status(404).json({
            status: 'error',
            message: 'New property not found'
          });
        }
      }
      
      const updatedUnit = await unitService.updateUnit(id, updateData);
      
      return res.status(200).json({
        status: 'success',
        message: 'Unit updated successfully',
        data: updatedUnit
      });
    } catch (error: any) {
      console.error('Error updating unit:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to update unit',
        code: error.code
      });
    }
  }
  
  /**
   * Set unit availability
   * @param req Request
   * @param res Response
   */
  async setUnitAvailability(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { isAvailable, dateAvailable } = req.body;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Unit ID is required'
        });
      }
      
      if (isAvailable === undefined) {
        return res.status(400).json({
          status: 'error',
          message: 'isAvailable flag is required'
        });
      }
      
      // Check if unit exists
      const existingUnit = await unitService.getUnitById(id);
      
      if (!existingUnit) {
        return res.status(404).json({
          status: 'error',
          message: 'Unit not found'
        });
      }
      
      // Parse date if provided
      let parsedDate = undefined;
      if (dateAvailable) {
        parsedDate = new Date(dateAvailable);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid dateAvailable format'
          });
        }
      }
      
      const updatedUnit = await unitService.setUnitAvailability(
        id,
        Boolean(isAvailable),
        parsedDate
      );
      
      return res.status(200).json({
        status: 'success',
        message: 'Unit availability updated successfully',
        data: updatedUnit
      });
    } catch (error: any) {
      console.error('Error setting unit availability:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to set unit availability',
        code: error.code
      });
    }
  }
  
  /**
   * Assign tenant to unit
   * @param req Request
   * @param res Response
   */
  async assignTenant(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { tenantId } = req.body;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Unit ID is required'
        });
      }
      
      if (!tenantId) {
        return res.status(400).json({
          status: 'error',
          message: 'Tenant ID is required'
        });
      }
      
      // Check if unit exists
      const existingUnit = await unitService.getUnitById(id);
      
      if (!existingUnit) {
        return res.status(404).json({
          status: 'error',
          message: 'Unit not found'
        });
      }
      
      // TODO: Check if tenant exists
      const tenant = await tenantService.getTenantById(tenantId);
      if (!tenant) {
          return res.status(404).json({ status: 'error', message: 'Tenant not found' });
      }
      
      const updatedUnit = await unitService.assignTenant(id, tenantId);
      
      return res.status(200).json({
        status: 'success',
        message: 'Tenant assigned to unit successfully',
        data: updatedUnit
      });
    } catch (error: any) {
      console.error('Error assigning tenant:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to assign tenant',
        code: error.code
      });
    }
  }
  
  /**
   * Remove tenant from unit
   * @param req Request
   * @param res Response
   */
  async removeTenant(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Unit ID is required'
        });
      }
      
      // Check if unit exists
      const existingUnit = await unitService.getUnitById(id);
      
      if (!existingUnit) {
        return res.status(404).json({
          status: 'error',
          message: 'Unit not found'
        });
      }
      
      // Check if unit has a tenant
      if (!existingUnit.tenantId) {
        return res.status(400).json({
          status: 'error',
          message: 'Unit does not have a tenant'
        });
      }
      
      const updatedUnit = await unitService.removeTenant(id);
      
      return res.status(200).json({
        status: 'success',
        message: 'Tenant removed from unit successfully',
        data: updatedUnit
      });
    } catch (error: any) {
      console.error('Error removing tenant:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to remove tenant',
        code: error.code
      });
    }
  }
  
  /**
   * Delete a unit
   * @param req Request
   * @param res Response
   */
  async deleteUnit(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Unit ID is required'
        });
      }
      
      // Check if unit exists
      const existingUnit = await unitService.getUnitById(id);
      
      if (!existingUnit) {
        return res.status(404).json({
          status: 'error',
          message: 'Unit not found'
        });
      }
      
      await unitService.deleteUnit(id);
      
      return res.status(200).json({
        status: 'success',
        message: 'Unit deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting unit:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to delete unit',
        code: error.code
      });
    }
  }
  
  /**
   * Get property occupancy statistics
   * @param req Request
   * @param res Response
   */
  async getPropertyOccupancy(req: Request, res: Response): Promise<Response> {
    try {
      const { propertyId } = req.params;
      
      if (!propertyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Property ID is required'
        });
      }
      
      // Check if property exists
      try {
        const property = await propertyService.getPropertyById(propertyId);
        if (!property) {
          return res.status(404).json({
            status: 'error',
            message: 'Property not found'
          });
        }
      } catch (error) {
        return res.status(404).json({
          status: 'error',
          message: 'Property not found'
        });
      }
      
      // Get occupancy rate
      const occupancyRate = await unitService.getOccupancyRate(propertyId);
      
      // Get vacant units count
      const vacantUnits = await unitService.getVacantUnitsCount(propertyId);
      
      return res.status(200).json({
        status: 'success',
        data: {
          occupancyRate,
          occupancyPercentage: Math.round(occupancyRate * 100),
          vacantUnits
        }
      });
    } catch (error: any) {
      console.error('Error getting property occupancy:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to get property occupancy',
        code: error.code
      });
    }
  }
}

// Export singleton instance
export const unitController = new UnitController();