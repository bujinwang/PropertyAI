import { Request, Response } from 'express';
import { searchController } from './searchController';
import { searchService } from '../services/searchService';

// Mock search service
jest.mock('../services/searchService', () => ({
  searchService: {
    searchProperties: jest.fn(),
    searchAvailableUnits: jest.fn()
  }
}));

// Mock error utility
jest.mock('../utils/errorUtils', () => ({
  formatErrorResponse: jest.fn().mockReturnValue({
    statusCode: 500,
    response: { success: false, message: 'Internal server error' }
  })
}));

describe('Search Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });
    
    mockRequest = {
      query: {}
    };
    
    mockResponse = {
      status: responseStatus,
      json: responseJson
    };
    
    jest.clearAllMocks();
  });

  describe('searchProperties', () => {
    it('should handle basic property search', async () => {
      // Arrange
      mockRequest.query = {
        city: 'San Francisco',
        bedrooms: '2',
        minRent: '1500',
        maxRent: '3000',
        page: '1',
        limit: '10'
      };
      
      const mockResult = {
        properties: [{ id: '1', name: 'Test Property' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };
      
      (searchService.searchProperties as jest.Mock).mockResolvedValue(mockResult);
      
      // Act
      await searchController.searchProperties(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assert
      expect(searchService.searchProperties).toHaveBeenCalledWith(expect.objectContaining({
        city: 'San Francisco',
        bedrooms: 2,
        minRent: 1500,
        maxRent: 3000,
        page: 1,
        limit: 10
      }));
      
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        status: 'success',
        data: mockResult
      });
    });
    
    it('should handle proximity search', async () => {
      // Arrange
      mockRequest.query = {
        latitude: '37.7749',
        longitude: '-122.4194',
        radius: '5',
        sortField: 'distance',
        sortOrder: 'asc'
      };
      
      const mockResult = {
        properties: [
          { id: '1', name: 'Nearby Property', distance: 1.5 },
          { id: '2', name: 'Farther Property', distance: 3.2 }
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      };
      
      (searchService.searchProperties as jest.Mock).mockResolvedValue(mockResult);
      
      // Act
      await searchController.searchProperties(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assert
      expect(searchService.searchProperties).toHaveBeenCalledWith(expect.objectContaining({
        latitude: 37.7749,
        longitude: -122.4194,
        radius: 5,
        sortField: 'distance',
        sortOrder: 'asc'
      }));
      
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        status: 'success',
        data: mockResult
      });
    });
    
    it('should handle error in property search', async () => {
      // Arrange
      mockRequest.query = {
        city: 'San Francisco'
      };
      
      const mockError = new Error('Database error');
      (searchService.searchProperties as jest.Mock).mockRejectedValue(mockError);
      
      // Act
      await searchController.searchProperties(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assert
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });
  });

  describe('searchAvailableUnits', () => {
    it('should handle basic unit search', async () => {
      // Arrange
      mockRequest.query = {
        bedrooms: '2',
        bathrooms: '1.5',
        minRent: '1500',
        maxRent: '3000',
        page: '1',
        limit: '10'
      };
      
      const mockResult = {
        units: [{ id: '1', unitNumber: '101', rent: 2000 }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };
      
      (searchService.searchAvailableUnits as jest.Mock).mockResolvedValue(mockResult);
      
      // Act
      await searchController.searchAvailableUnits(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assert
      expect(searchService.searchAvailableUnits).toHaveBeenCalledWith(expect.objectContaining({
        bedrooms: 2,
        bathrooms: 1.5,
        minRent: 1500,
        maxRent: 3000,
        page: 1,
        limit: 10,
        isAvailable: true
      }));
      
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        status: 'success',
        data: mockResult
      });
    });
    
    it('should handle error in unit search', async () => {
      // Arrange
      mockRequest.query = {
        bedrooms: '2'
      };
      
      const mockError = new Error('Database error');
      (searchService.searchAvailableUnits as jest.Mock).mockRejectedValue(mockError);
      
      // Act
      await searchController.searchAvailableUnits(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assert
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });
  });

  describe('getPropertyTypes', () => {
    it('should return all property types', () => {
      // Act
      searchController.getPropertyTypes(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assert
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        status: 'success',
        data: expect.any(Array)
      });
    });
  });
}); 