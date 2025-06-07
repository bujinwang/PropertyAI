import { Request, Response } from 'express';
import { imageController } from './imageController';
import { propertyImageService, unitImageService } from '../services/imageService';

// Mock the image services
jest.mock('../services/imageService', () => ({
  propertyImageService: {
    addPropertyImages: jest.fn(),
    getPropertyImages: jest.fn(),
    deletePropertyImage: jest.fn(),
    setFeaturedImage: jest.fn()
  },
  unitImageService: {
    addUnitImages: jest.fn(),
    getUnitImages: jest.fn(),
    deleteUnitImage: jest.fn(),
    setFeaturedImage: jest.fn()
  },
  imageProcessingService: {
    processImage: jest.fn(),
    optimizeImage: jest.fn()
  }
}));

// Mock error utility
jest.mock('../utils/errorUtils', () => ({
  formatErrorResponse: jest.fn().mockReturnValue({
    statusCode: 500,
    response: { success: false, message: 'Internal server error' }
  }),
  ErrorWithStatus: class ErrorWithStatus extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  }
}));

describe('Image Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });
    
    mockRequest = {
      params: {},
      query: {},
      files: []
    };
    
    mockResponse = {
      status: responseStatus,
      json: responseJson
    };
    
    jest.clearAllMocks();
  });

  describe('uploadPropertyImages', () => {
    it('should return 400 if no files are uploaded', async () => {
      // Arrange
      mockRequest.files = [];
      mockRequest.params = { propertyId: '1' };
      
      // Act
      await imageController.uploadPropertyImages(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assert
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'No files uploaded'
      });
    });

    it('should successfully upload property images', async () => {
      // Arrange
      const mockFiles = [
        {
          filename: 'test1.jpg',
          originalname: 'original1.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          path: '/path/to/file1.jpg'
        },
        {
          filename: 'test2.jpg',
          originalname: 'original2.jpg',
          mimetype: 'image/jpeg',
          size: 2048,
          path: '/path/to/file2.jpg'
        }
      ];
      
      mockRequest.files = mockFiles as unknown as Express.Multer.File[];
      mockRequest.params = { propertyId: '1' };
      mockRequest.query = { featured: 'true' };
      
      const mockResult = {
        images: [{ id: 1, url: 'http://test.com/image1.jpg' }],
        featuredImage: { id: 1, url: 'http://test.com/image1.jpg' }
      };
      
      (propertyImageService.addPropertyImages as jest.Mock).mockResolvedValue(mockResult);
      
      // Act
      await imageController.uploadPropertyImages(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assert
      expect(propertyImageService.addPropertyImages).toHaveBeenCalledWith(
        1,
        expect.any(Array),
        true
      );
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Images uploaded successfully',
        data: mockResult
      });
    });
  });

  describe('getPropertyImages', () => {
    it('should return property images with pagination', async () => {
      // Arrange
      mockRequest.params = { propertyId: '1' };
      mockRequest.query = { page: '1', limit: '20' };
      
      const mockResult = {
        images: [{ id: 1, url: 'http://test.com/image1.jpg' }],
        pagination: { total: 1, page: 1, limit: 20, pages: 1 }
      };
      
      (propertyImageService.getPropertyImages as jest.Mock).mockResolvedValue(mockResult);
      
      // Act
      await imageController.getPropertyImages(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assert
      expect(propertyImageService.getPropertyImages).toHaveBeenCalledWith(1, 1, 20);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });
  });

  // Similar tests for unit image operations can be added
}); 