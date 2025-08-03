import { Request, Response } from 'express';
import { rentalService, CreateRentalDto, UpdateRentalDto, RentalFilterParams, ListingStatus } from '../services/rentalService';

/**
 * Rental controller to handle HTTP requests related to rental management
 */
export class RentalController {
  /**
   * Create a new rental
   * @param req Request
   * @param res Response
   */
  async createRental(req: Request, res: Response): Promise<Response> {
    try {
      const rentalData: CreateRentalDto = req.body;
      
      // Validate required fields
      const requiredFields = ['title', 'address', 'city', 'state', 'zipCode', 'propertyType', 'rent', 'managerId', 'ownerId', 'createdById'];
      const missingFields = requiredFields.filter(field => !rentalData[field as keyof CreateRentalDto]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required fields',
          missingFields
        });
      }
      
      const rental = await rentalService.createRental(rentalData);
      
      return res.status(201).json({
        status: 'success',
        message: 'Rental created successfully',
        data: rental
      });
    } catch (error: any) {
      console.error('Error creating rental:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to create rental',
        code: error.code
      });
    }
  }
  
  /**
   * Get a rental by ID
   * @param req Request
   * @param res Response
   */
  async getRentalById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Rental ID is required'
        });
      }
      
      const rental = await rentalService.getRentalById(id);
      
      if (!rental) {
        return res.status(404).json({
          status: 'error',
          message: 'Rental not found'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: rental
      });
    } catch (error: any) {
      console.error('Error getting rental:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to get rental',
        code: error.code
      });
    }
  }
  
  /**
   * Get rentals with filtering and pagination
   * @param req Request
   * @param res Response
   */
  async getRentals(req: Request, res: Response): Promise<Response> {
    try {
      const {
        title,
        city,
        state,
        zipCode,
        propertyType,
        minBedrooms,
        maxBedrooms,
        minBathrooms,
        maxBathrooms,
        minRent,
        maxRent,
        minSize,
        maxSize,
        isAvailable,
        status,
        managerId,
        ownerId,
        isActive,
        page = 1,
        limit = 10,
        sortField = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      // Build filter object
      const filters: RentalFilterParams = {};
      
      if (title) filters.title = String(title);
      if (city) filters.city = String(city);
      if (state) filters.state = String(state);
      if (zipCode) filters.zipCode = String(zipCode);
      if (propertyType) filters.propertyType = propertyType as any;
      if (minBedrooms) filters.minBedrooms = parseInt(String(minBedrooms), 10);
      if (maxBedrooms) filters.maxBedrooms = parseInt(String(maxBedrooms), 10);
      if (minBathrooms) filters.minBathrooms = parseFloat(String(minBathrooms));
      if (maxBathrooms) filters.maxBathrooms = parseFloat(String(maxBathrooms));
      if (minRent) filters.minRent = parseFloat(String(minRent));
      if (maxRent) filters.maxRent = parseFloat(String(maxRent));
      if (minSize) filters.minSize = parseFloat(String(minSize));
      if (maxSize) filters.maxSize = parseFloat(String(maxSize));
      if (isAvailable !== undefined) filters.isAvailable = isAvailable === 'true';
      if (status) filters.status = status as ListingStatus;
      if (managerId) filters.managerId = String(managerId);
      if (ownerId) filters.ownerId = String(ownerId);
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      // Validate sort order
      const validSortOrder = sortOrder === 'asc' || sortOrder === 'desc' 
        ? sortOrder 
        : 'desc';
      
      const result = await rentalService.getRentals(
        filters,
        parseInt(String(page), 10),
        parseInt(String(limit), 10),
        String(sortField),
        validSortOrder as 'asc' | 'desc'
      );
      
      return res.status(200).json({
        status: 'success',
        data: result.rentals,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error: any) {
      console.error('Error getting rentals:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to get rentals',
        code: error.code
      });
    }
  }
  
  /**
   * Get public rentals (for public listing pages)
   * @param req Request
   * @param res Response
   */
  async getPublicRentals(req: Request, res: Response): Promise<Response> {
    try {
      const {
        city,
        state,
        zipCode,
        propertyType,
        minBedrooms,
        maxBedrooms,
        minBathrooms,
        maxBathrooms,
        minRent,
        maxRent,
        minSize,
        maxSize,
        page = 1,
        limit = 10,
        sortField = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      // Build filter object for public listings (only active and available)
      const filters: RentalFilterParams = {
        isActive: true,
        isAvailable: true,
        status: ListingStatus.ACTIVE
      };
      
      if (city) filters.city = String(city);
      if (state) filters.state = String(state);
      if (zipCode) filters.zipCode = String(zipCode);
      if (propertyType) filters.propertyType = propertyType as any;
      if (minBedrooms) filters.minBedrooms = parseInt(String(minBedrooms), 10);
      if (maxBedrooms) filters.maxBedrooms = parseInt(String(maxBedrooms), 10);
      if (minBathrooms) filters.minBathrooms = parseFloat(String(minBathrooms));
      if (maxBathrooms) filters.maxBathrooms = parseFloat(String(maxBathrooms));
      if (minRent) filters.minRent = parseFloat(String(minRent));
      if (maxRent) filters.maxRent = parseFloat(String(maxRent));
      if (minSize) filters.minSize = parseFloat(String(minSize));
      if (maxSize) filters.maxSize = parseFloat(String(maxSize));
      
      // Validate sort order
      const validSortOrder = sortOrder === 'asc' || sortOrder === 'desc' 
        ? sortOrder 
        : 'desc';
      
      const result = await rentalService.getRentals(
        filters,
        parseInt(String(page), 10),
        parseInt(String(limit), 10),
        String(sortField),
        validSortOrder as 'asc' | 'desc'
      );
      
      return res.status(200).json({
        status: 'success',
        data: result.rentals,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error: any) {
      console.error('Error getting public rentals:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to get public rentals',
        code: error.code
      });
    }
  }

  /**
   * Get rentals by manager ID
   * @param req Request
   * @param res Response
   */
  async getRentalsByManager(req: Request, res: Response): Promise<Response> {
    try {
      const { managerId } = req.params;
      const { includeInactive = false } = req.query;
      
      if (!managerId) {
        return res.status(400).json({
          status: 'error',
          message: 'Manager ID is required'
        });
      }
      
      const rentals = await rentalService.getRentalsByManagerId(
        managerId,
        includeInactive === 'true'
      );
      
      return res.status(200).json({
        status: 'success',
        data: rentals
      });
    } catch (error: any) {
      console.error('Error getting rentals by manager:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to get rentals by manager',
        code: error.code
      });
    }
  }
  
  /**
   * Get rentals by owner ID
   * @param req Request
   * @param res Response
   */
  async getRentalsByOwner(req: Request, res: Response): Promise<Response> {
    try {
      const { ownerId } = req.params;
      const { includeInactive = false } = req.query;
      
      if (!ownerId) {
        return res.status(400).json({
          status: 'error',
          message: 'Owner ID is required'
        });
      }
      
      const rentals = await rentalService.getRentalsByOwnerId(
        ownerId,
        includeInactive === 'true'
      );
      
      return res.status(200).json({
        status: 'success',
        data: rentals
      });
    } catch (error: any) {
      console.error('Error getting rentals by owner:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to get rentals by owner',
        code: error.code
      });
    }
  }
  
  /**
   * Update a rental
   * @param req Request
   * @param res Response
   */
  async updateRental(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updateData: UpdateRentalDto = req.body;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Rental ID is required'
        });
      }
      
      // Check if rental exists
      const existingRental = await rentalService.getRentalById(id);
      if (!existingRental) {
        return res.status(404).json({
          status: 'error',
          message: 'Rental not found'
        });
      }
      
      const updatedRental = await rentalService.updateRental(id, updateData);
      
      return res.status(200).json({
        status: 'success',
        message: 'Rental updated successfully',
        data: updatedRental
      });
    } catch (error: any) {
      console.error('Error updating rental:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to update rental',
        code: error.code
      });
    }
  }
  
  /**
   * Set rental availability
   * @param req Request
   * @param res Response
   */
  async setRentalAvailability(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { isAvailable, availableDate } = req.body;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Rental ID is required'
        });
      }
      
      if (typeof isAvailable !== 'boolean') {
        return res.status(400).json({
          status: 'error',
          message: 'isAvailable must be a boolean'
        });
      }
      
      // Check if rental exists
      const existingRental = await rentalService.getRentalById(id);
      if (!existingRental) {
        return res.status(404).json({
          status: 'error',
          message: 'Rental not found'
        });
      }
      
      const updatedRental = await rentalService.setRentalAvailability(
        id, 
        isAvailable, 
        availableDate ? new Date(availableDate) : undefined
      );
      
      return res.status(200).json({
        status: 'success',
        message: 'Rental availability updated successfully',
        data: updatedRental
      });
    } catch (error: any) {
      console.error('Error setting rental availability:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to set rental availability',
        code: error.code
      });
    }
  }
  
  /**
   * Set rental status
   * @param req Request
   * @param res Response
   */
  async setRentalStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Rental ID is required'
        });
      }
      
      if (!status || !Object.values(ListingStatus).includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Valid status is required',
          validStatuses: Object.values(ListingStatus)
        });
      }
      
      // Check if rental exists
      const existingRental = await rentalService.getRentalById(id);
      if (!existingRental) {
        return res.status(404).json({
          status: 'error',
          message: 'Rental not found'
        });
      }
      
      const updatedRental = await rentalService.setRentalStatus(id, status);
      
      return res.status(200).json({
        status: 'success',
        message: 'Rental status updated successfully',
        data: updatedRental
      });
    } catch (error: any) {
      console.error('Error setting rental status:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to set rental status',
        code: error.code
      });
    }
  }
  
  /**
   * Set rental active status
   * @param req Request
   * @param res Response
   */
  async setRentalActiveStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Rental ID is required'
        });
      }
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          status: 'error',
          message: 'isActive must be a boolean'
        });
      }
      
      // Check if rental exists
      const existingRental = await rentalService.getRentalById(id);
      if (!existingRental) {
        return res.status(404).json({
          status: 'error',
          message: 'Rental not found'
        });
      }
      
      const updatedRental = await rentalService.setRentalActiveStatus(id, isActive);
      
      return res.status(200).json({
        status: 'success',
        message: 'Rental active status updated successfully',
        data: updatedRental
      });
    } catch (error: any) {
      console.error('Error setting rental active status:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to set rental active status',
        code: error.code
      });
    }
  }
  
  /**
   * Delete a rental
   * @param req Request
   * @param res Response
   */
  async deleteRental(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Rental ID is required'
        });
      }
      
      // Check if rental exists
      const existingRental = await rentalService.getRentalById(id);
      if (!existingRental) {
        return res.status(404).json({
          status: 'error',
          message: 'Rental not found'
        });
      }
      
      await rentalService.deleteRental(id);
      
      return res.status(200).json({
        status: 'success',
        message: 'Rental deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting rental:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to delete rental',
        code: error.code
      });
    }
  }
  
  /**
   * Get rental statistics
   * @param req Request
   * @param res Response
   */
  async getRentalStats(req: Request, res: Response): Promise<Response> {
    try {
      const { managerId, ownerId } = req.query;
      
      const stats = await rentalService.getRentalStats(
        managerId ? String(managerId) : undefined,
        ownerId ? String(ownerId) : undefined
      );
      
      return res.status(200).json({
        status: 'success',
        data: stats
      });
    } catch (error: any) {
      console.error('Error getting rental stats:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to get rental stats',
        code: error.code
      });
    }
  }
  
  /**
   * Get rental counts by type
   * @param req Request
   * @param res Response
   */
  async getRentalCountsByType(req: Request, res: Response): Promise<Response> {
    try {
      const counts = await rentalService.countRentalsByType();
      
      return res.status(200).json({
        status: 'success',
        data: counts
      });
    } catch (error: any) {
      console.error('Error getting rental counts by type:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to get rental counts by type',
        code: error.code
      });
    }
  }

  /**
   * Get public rental by ID (for public listing pages)
   * @param req Request
   * @param res Response
   */
  async getPublicRentalById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Rental ID is required'
        });
      }
      
      const rental = await rentalService.getRentalById(id);
      
      if (!rental || !rental.isActive || !rental.isAvailable || rental.status !== ListingStatus.ACTIVE) {
        return res.status(404).json({
          status: 'error',
          message: 'Rental not found or not available'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: rental
      });
    } catch (error: any) {
      console.error('Error getting public rental:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to get public rental',
        code: error.code
      });
    }
  }

  /**
   * Search rentals with advanced filtering
   * @param req Request
   * @param res Response
   */
  async searchRentals(req: Request, res: Response): Promise<Response> {
    try {
      const { searchTerm, ...filters } = req.body;
      const { page = 1, limit = 10 } = req.query;
      
      const result = await rentalService.searchRentals(
        searchTerm || '',
        filters,
        parseInt(String(page), 10),
        parseInt(String(limit), 10)
      );
      
      return res.status(200).json({
        status: 'success',
        data: result.rentals,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error: any) {
      console.error('Error searching rentals:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to search rentals',
        code: error.code
      });
    }
  }

  /**
   * Bulk create rentals
   * @param req Request
   * @param res Response
   */
  async bulkCreateRentals(req: Request, res: Response): Promise<Response> {
    try {
      const { rentals } = req.body;
      
      if (!Array.isArray(rentals) || rentals.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Rentals array is required and must not be empty'
        });
      }
      
      const result = await rentalService.bulkCreateRentals(rentals);
      
      return res.status(201).json({
        status: 'success',
        message: `${result.successful.length} rentals created successfully`,
        data: {
          successful: result.successful,
          failed: result.failed
        }
      });
    } catch (error: any) {
      console.error('Error bulk creating rentals:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to bulk create rentals',
        code: error.code
      });
    }
  }

  /**
   * Bulk update rentals
   * @param req Request
   * @param res Response
   */
  async bulkUpdateRentals(req: Request, res: Response): Promise<Response> {
    try {
      const { updates } = req.body;
      
      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Updates array is required and must not be empty'
        });
      }
      
      const result = await rentalService.bulkUpdateRentals(updates);
      
      return res.status(200).json({
        status: 'success',
        message: `${result.successful.length} rentals updated successfully`,
        data: {
          successful: result.successful,
          failed: result.failed
        }
      });
    } catch (error: any) {
      console.error('Error bulk updating rentals:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to bulk update rentals',
        code: error.code
      });
    }
  }

  /**
   * Bulk delete rentals
   * @param req Request
   * @param res Response
   */
  async bulkDeleteRentals(req: Request, res: Response): Promise<Response> {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'IDs array is required and must not be empty'
        });
      }
      
      const result = await rentalService.bulkDeleteRentals(ids);
      
      return res.status(200).json({
        status: 'success',
        message: `${result.deletedCount} rentals deleted successfully`,
        data: {
          deletedCount: result.deletedCount,
          success: result.success
        }
      });
    } catch (error: any) {
      console.error('Error bulk deleting rentals:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to bulk delete rentals',
        code: error.code
      });
    }
  }

  /**
   * Get rental analytics
   * @param req Request
   * @param res Response
   */
  async getRentalAnalytics(req: Request, res: Response): Promise<Response> {
    try {
      const { managerId, ownerId, startDate, endDate } = req.query;
      
      const analytics = await rentalService.getRentalAnalytics({
        managerId: managerId ? String(managerId) : undefined,
        ownerId: ownerId ? String(ownerId) : undefined,
        startDate: startDate ? new Date(String(startDate)) : undefined,
        endDate: endDate ? new Date(String(endDate)) : undefined
      });
      
      return res.status(200).json({
        status: 'success',
        data: analytics
      });
    } catch (error: any) {
      console.error('Error getting rental analytics:', error);
      
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Failed to get rental analytics',
        code: error.code
      });
    }
  }
}

// Export a singleton instance
export const rentalController = new RentalController();
export default rentalController;