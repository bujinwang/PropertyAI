import { Request, Response } from 'express';
import { propertyService, PropertyType, CreatePropertyDto, UpdatePropertyDto } from '../services/propertyService';

/**
 * Property controller to handle HTTP requests related to property management
 */
export class PropertyController {
  /**
   * Create a new property
   * @param req Request
   * @param res Response
   */
  async createProperty(req: Request, res: Response): Promise<Response> {
    try {
      const propertyData: CreatePropertyDto = req.body;
      
      // Validate required fields
      const requiredFields = [
        'name', 'address', 'city', 'state', 'zipCode', 
        'propertyType', 'totalUnits', 'managerId', 'ownerId'
      ];
      
      const missingFields = requiredFields.filter(field => !propertyData[field as keyof CreatePropertyDto]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required fields',
          missingFields
        });
      }
      
      // Validate property type
      if (propertyData.propertyType && !Object.values(PropertyType).includes(propertyData.propertyType)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid property type',
          validTypes: Object.values(PropertyType)
        });
      }
      
      const property = await propertyService.createProperty(propertyData);
      
      return res.status(201).json({
        status: 'success',
        message: 'Property created successfully',
        data: property
      });
    } catch (error: any) {
      console.error('Error creating property:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to create property',
        code: error.code
      });
    }
  }
  
  /**
   * Get a property by ID
   * @param req Request
   * @param res Response
   */
  async getPropertyById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Property ID is required'
        });
      }
      
      const property = await propertyService.getPropertyById(id);
      
      if (!property) {
        return res.status(404).json({
          status: 'error',
          message: 'Property not found'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: property
      });
    } catch (error: any) {
      console.error('Error getting property:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to get property',
        code: error.code
      });
    }
  }
  
  /**
   * Get properties with filtering and pagination
   * @param req Request
   * @param res Response
   */
  async getProperties(req: Request, res: Response): Promise<Response> {
    try {
      const {
        name,
        city,
        state,
        zipCode,
        propertyType,
        minUnits,
        maxUnits,
        managerId,
        ownerId,
        isActive,
        page = 1,
        limit = 10,
        sortField = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      // Build filter object
      const filters: any = {};
      
      if (name) filters.name = String(name);
      if (city) filters.city = String(city);
      if (state) filters.state = String(state);
      if (zipCode) filters.zipCode = String(zipCode);
      if (propertyType) filters.propertyType = String(propertyType);
      if (minUnits) filters.minUnits = parseInt(String(minUnits), 10);
      if (maxUnits) filters.maxUnits = parseInt(String(maxUnits), 10);
      if (managerId) filters.managerId = String(managerId);
      if (ownerId) filters.ownerId = String(ownerId);
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      // Validate property type if provided
      if (filters.propertyType && !Object.values(PropertyType).includes(filters.propertyType)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid property type',
          validTypes: Object.values(PropertyType)
        });
      }
      
      // Validate sort order
      const validSortOrder = sortOrder === 'asc' || sortOrder === 'desc' 
        ? sortOrder 
        : 'desc';
      
      const result = await propertyService.getProperties(
        filters,
        parseInt(String(page), 10),
        parseInt(String(limit), 10),
        String(sortField),
        validSortOrder as 'asc' | 'desc'
      );
      
      return res.status(200).json({
        status: 'success',
        data: result.properties,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error: any) {
      console.error('Error getting properties:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to get properties',
        code: error.code
      });
    }
  }
  
  /**
   * Update a property
   * @param req Request
   * @param res Response
   */
  async updateProperty(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updateData: UpdatePropertyDto = req.body;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Property ID is required'
        });
      }
      
      // Check if property exists
      const existingProperty = await propertyService.getPropertyById(id);
      
      if (!existingProperty) {
        return res.status(404).json({
          status: 'error',
          message: 'Property not found'
        });
      }
      
      // Validate property type if provided
      if (updateData.propertyType && !Object.values(PropertyType).includes(updateData.propertyType)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid property type',
          validTypes: Object.values(PropertyType)
        });
      }
      
      const updatedProperty = await propertyService.updateProperty(id, updateData);
      
      return res.status(200).json({
        status: 'success',
        message: 'Property updated successfully',
        data: updatedProperty
      });
    } catch (error: any) {
      console.error('Error updating property:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to update property',
        code: error.code
      });
    }
  }
  
  /**
   * Delete a property (soft delete)
   * @param req Request
   * @param res Response
   */
  async deleteProperty(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { permanent = false } = req.query;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Property ID is required'
        });
      }
      
      // Check if property exists
      const existingProperty = await propertyService.getPropertyById(id);
      
      if (!existingProperty) {
        return res.status(404).json({
          status: 'error',
          message: 'Property not found'
        });
      }
      
      // Determine deletion type
      if (permanent === 'true') {
        // Hard delete
        await propertyService.hardDeleteProperty(id);
        
        return res.status(200).json({
          status: 'success',
          message: 'Property permanently deleted'
        });
      } else {
        // Soft delete
        const deactivatedProperty = await propertyService.softDeleteProperty(id);
        
        return res.status(200).json({
          status: 'success',
          message: 'Property deactivated successfully',
          data: deactivatedProperty
        });
      }
    } catch (error: any) {
      console.error('Error deleting property:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to delete property',
        code: error.code
      });
    }
  }
  
  /**
   * Get property statistics
   * @param req Request
   * @param res Response
   */
  async getPropertyStats(req: Request, res: Response): Promise<Response> {
    try {
      const typeCount = await propertyService.countPropertiesByType();
      
      return res.status(200).json({
        status: 'success',
        data: {
          countByType: typeCount
        }
      });
    } catch (error: any) {
      console.error('Error getting property stats:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to get property statistics',
        code: error.code
      });
    }
  }
}

// Export singleton instance
export const propertyController = new PropertyController(); 