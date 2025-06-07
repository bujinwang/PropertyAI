import { Request, Response } from 'express';
import { configureUpload } from '../config/storage';
import { propertyImageService, unitImageService, imageProcessingService } from '../services/imageService';
import { formatErrorResponse } from '../utils/errorUtils';

/**
 * Controller for handling property and unit image uploads
 */
export const imageController = {
  /**
   * Upload property images
   */
  async uploadPropertyImages(req: Request, res: Response) {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const isFeatured = req.query.featured === 'true';
      
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }
      
      // Convert multer files to our image data format
      const imageData = (req.files as Express.Multer.File[]).map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        location: (file as any).location
      }));
      
      // Save images to database and associate with property
      const result = await propertyImageService.addPropertyImages(
        propertyId,
        imageData,
        isFeatured
      );
      
      return res.status(201).json({
        success: true,
        message: 'Images uploaded successfully',
        data: {
          images: result.images,
          featuredImage: result.featuredImage
        }
      });
    } catch (error) {
      console.error('Error uploading property images:', error);
      const { statusCode, response } = formatErrorResponse(error);
      return res.status(statusCode).json(response);
    }
  },
  
  /**
   * Get property images
   */
  async getPropertyImages(req: Request, res: Response) {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await propertyImageService.getPropertyImages(propertyId, page, limit);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting property images:', error);
      const { statusCode, response } = formatErrorResponse(error);
      return res.status(statusCode).json(response);
    }
  },
  
  /**
   * Delete property image
   */
  async deletePropertyImage(req: Request, res: Response) {
    try {
      const imageId = parseInt(req.params.imageId);
      
      const result = await propertyImageService.deletePropertyImage(imageId);
      
      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting property image:', error);
      const { statusCode, response } = formatErrorResponse(error);
      return res.status(statusCode).json(response);
    }
  },
  
  /**
   * Set featured property image
   */
  async setFeaturedPropertyImage(req: Request, res: Response) {
    try {
      const imageId = parseInt(req.params.imageId);
      const propertyId = parseInt(req.params.propertyId);
      
      const result = await propertyImageService.setFeaturedImage(imageId, propertyId);
      
      return res.status(200).json({
        success: true,
        message: 'Featured image set successfully'
      });
    } catch (error) {
      console.error('Error setting featured property image:', error);
      const { statusCode, response } = formatErrorResponse(error);
      return res.status(statusCode).json(response);
    }
  },
  
  /**
   * Upload unit images
   */
  async uploadUnitImages(req: Request, res: Response) {
    try {
      const unitId = parseInt(req.params.unitId);
      const isFeatured = req.query.featured === 'true';
      
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }
      
      // Convert multer files to our image data format
      const imageData = (req.files as Express.Multer.File[]).map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        location: (file as any).location
      }));
      
      // Save images to database and associate with unit
      const result = await unitImageService.addUnitImages(
        unitId,
        imageData,
        isFeatured
      );
      
      return res.status(201).json({
        success: true,
        message: 'Images uploaded successfully',
        data: {
          images: result.images,
          featuredImage: result.featuredImage
        }
      });
    } catch (error) {
      console.error('Error uploading unit images:', error);
      const { statusCode, response } = formatErrorResponse(error);
      return res.status(statusCode).json(response);
    }
  },
  
  /**
   * Get unit images
   */
  async getUnitImages(req: Request, res: Response) {
    try {
      const unitId = parseInt(req.params.unitId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await unitImageService.getUnitImages(unitId, page, limit);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting unit images:', error);
      const { statusCode, response } = formatErrorResponse(error);
      return res.status(statusCode).json(response);
    }
  },
  
  /**
   * Delete unit image
   */
  async deleteUnitImage(req: Request, res: Response) {
    try {
      const imageId = parseInt(req.params.imageId);
      
      const result = await unitImageService.deleteUnitImage(imageId);
      
      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting unit image:', error);
      const { statusCode, response } = formatErrorResponse(error);
      return res.status(statusCode).json(response);
    }
  },
  
  /**
   * Set featured unit image
   */
  async setFeaturedUnitImage(req: Request, res: Response) {
    try {
      const imageId = parseInt(req.params.imageId);
      const unitId = parseInt(req.params.unitId);
      
      const result = await unitImageService.setFeaturedImage(imageId, unitId);
      
      return res.status(200).json({
        success: true,
        message: 'Featured image set successfully'
      });
    } catch (error) {
      console.error('Error setting featured unit image:', error);
      const { statusCode, response } = formatErrorResponse(error);
      return res.status(statusCode).json(response);
    }
  }
};

export default imageController; 