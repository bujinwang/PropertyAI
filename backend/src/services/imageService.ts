import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { getFileUrl, deleteFile } from '../config/storage';
import { ErrorWithStatus } from '../utils/errorUtils';

const prisma = new PrismaClient();

// Define interfaces for our image types since they're not exported by Prisma
interface PropertyImage {
  id: number;
  propertyId: string;
  filename: string;
  originalFilename: string;
  mimetype: string;
  size: number;
  url: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UnitImage {
  id: number;
  unitId: string;
  filename: string;
  originalFilename: string;
  mimetype: string;
  size: number;
  url: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ImageData {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path?: string;
  location?: string;
}

interface ProcessedImage {
  original: string;
  thumbnail: string | null;
  medium: string | null;
}

/**
 * Handle images for properties
 */
export const propertyImageService = {
  /**
   * Add images to a property
   */
  async addPropertyImages(
    propertyId: number,
    images: ImageData[],
    isFeatured: boolean = false
  ): Promise<{ images: PropertyImage[], featuredImage: PropertyImage | null }> {
    try {
      // Check if property exists
      const property = await prisma.property.findUnique({
        where: { id: propertyId.toString() },
        select: { id: true }
      });

      if (!property) {
        throw new ErrorWithStatus('Property not found', 404);
      }

      const savedImages: PropertyImage[] = [];
      let featuredImage: PropertyImage | null = null;

      // Process and save each image
      for (const image of images) {
        const imageData = {
          propertyId: propertyId.toString(),
          filename: image.filename,
          originalFilename: image.originalname,
          mimetype: image.mimetype,
          size: image.size,
          url: getFileUrl(image.filename, 'properties'),
          isFeatured: isFeatured && featuredImage === null, // Only set the first image as featured if requested
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const savedImage = await prisma.propertyImage.create({
          data: imageData
        }) as PropertyImage;

        savedImages.push(savedImage);

        // Set as featured image if it's the first one and isFeatured is true
        if (isFeatured && featuredImage === null) {
          featuredImage = savedImage;
        }
      }

      return { images: savedImages, featuredImage };
    } catch (error) {
      console.error('Error adding property images:', error);
      throw error;
    }
  },

  /**
   * Get all images for a property
   */
  async getPropertyImages(propertyId: number, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      // Count total images
      const totalImages = await prisma.propertyImage.count({
        where: { propertyId: propertyId.toString() }
      });

      // Get paginated images
      const images = await prisma.propertyImage.findMany({
        where: { propertyId: propertyId.toString() },
        orderBy: [
          { isFeatured: 'desc' }, // Featured images first
          { createdAt: 'desc' }   // Then by creation date
        ],
        skip,
        take: limit
      });

      return {
        images,
        pagination: {
          total: totalImages,
          page,
          limit,
          pages: Math.ceil(totalImages / limit)
        }
      };
    } catch (error) {
      console.error('Error getting property images:', error);
      throw error;
    }
  },

  /**
   * Delete an image from a property
   */
  async deletePropertyImage(imageId: number) {
    try {
      // Get image details
      const image = await prisma.propertyImage.findUnique({
        where: { id: imageId }
      });

      if (!image) {
        throw new ErrorWithStatus('Image not found', 404);
      }

      // Delete the file
      await deleteFile(image.filename, 'properties');

      // Delete from database
      await prisma.propertyImage.delete({
        where: { id: imageId }
      });

      // If the deleted image was featured, set a new featured image if available
      if (image.isFeatured) {
        const nextImage = await prisma.propertyImage.findFirst({
          where: { propertyId: image.propertyId },
          orderBy: { createdAt: 'desc' }
        });

        if (nextImage) {
          await prisma.propertyImage.update({
            where: { id: nextImage.id },
            data: { isFeatured: true }
          });
        }
      }

      return { success: true, message: 'Image deleted successfully' };
    } catch (error) {
      console.error('Error deleting property image:', error);
      throw error;
    }
  },

  /**
   * Set an image as the featured image for a property
   */
  async setFeaturedImage(imageId: number, propertyId: number) {
    try {
      // Check if the image exists and belongs to the property
      const image = await prisma.propertyImage.findFirst({
        where: {
          id: imageId,
          propertyId: propertyId.toString()
        }
      });

      if (!image) {
        throw new ErrorWithStatus('Image not found or does not belong to this property', 404);
      }

      // Clear any existing featured images
      await prisma.propertyImage.updateMany({
        where: {
          propertyId: propertyId.toString(),
          isFeatured: true
        },
        data: {
          isFeatured: false
        }
      });

      // Set the specified image as featured
      await prisma.propertyImage.update({
        where: {
          id: imageId
        },
        data: {
          isFeatured: true
        }
      });

      return {
        success: true,
        message: 'Featured image set successfully'
      };
    } catch (error) {
      console.error('Error setting featured image:', error);
      throw error;
    }
  }
};

/**
 * Handle images for property units
 */
export const unitImageService = {
  /**
   * Add images to a unit
   */
  async addUnitImages(
    unitId: number,
    images: ImageData[],
    isFeatured: boolean = false
  ): Promise<{ images: UnitImage[], featuredImage: UnitImage | null }> {
    try {
      // Check if unit exists
      const unit = await prisma.unit.findUnique({
        where: { id: unitId.toString() },
        select: { id: true }
      });

      if (!unit) {
        throw new ErrorWithStatus('Unit not found', 404);
      }

      const savedImages: UnitImage[] = [];
      let featuredImage: UnitImage | null = null;

      // Process and save each image
      for (const image of images) {
        const imageData = {
          unitId: unitId.toString(),
          filename: image.filename,
          originalFilename: image.originalname,
          mimetype: image.mimetype,
          size: image.size,
          url: getFileUrl(image.filename, 'units'),
          isFeatured: isFeatured && featuredImage === null, // Only set the first image as featured if requested
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const savedImage = await prisma.unitImage.create({
          data: imageData
        }) as UnitImage;

        savedImages.push(savedImage);

        // Set as featured image if it's the first one and isFeatured is true
        if (isFeatured && featuredImage === null) {
          featuredImage = savedImage;
        }
      }

      return { images: savedImages, featuredImage };
    } catch (error) {
      console.error('Error adding unit images:', error);
      throw error;
    }
  },

  /**
   * Get all images for a unit
   */
  async getUnitImages(unitId: number, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      // Count total images
      const totalImages = await prisma.unitImage.count({
        where: { unitId: unitId.toString() }
      });

      // Get paginated images
      const images = await prisma.unitImage.findMany({
        where: { unitId: unitId.toString() },
        orderBy: [
          { isFeatured: 'desc' }, // Featured images first
          { createdAt: 'desc' }   // Then by creation date
        ],
        skip,
        take: limit
      });

      return {
        images,
        pagination: {
          total: totalImages,
          page,
          limit,
          pages: Math.ceil(totalImages / limit)
        }
      };
    } catch (error) {
      console.error('Error getting unit images:', error);
      throw error;
    }
  },

  /**
   * Delete an image from a unit
   */
  async deleteUnitImage(imageId: number) {
    try {
      // Get image details
      const image = await prisma.unitImage.findUnique({
        where: { id: imageId }
      });

      if (!image) {
        throw new ErrorWithStatus('Image not found', 404);
      }

      // Delete the file
      await deleteFile(image.filename, 'units');

      // Delete from database
      await prisma.unitImage.delete({
        where: { id: imageId }
      });

      // If the deleted image was featured, set a new featured image if available
      if (image.isFeatured) {
        const nextImage = await prisma.unitImage.findFirst({
          where: { unitId: image.unitId },
          orderBy: { createdAt: 'desc' }
        });

        if (nextImage) {
          await prisma.unitImage.update({
            where: { id: nextImage.id },
            data: { isFeatured: true }
          });
        }
      }

      return { success: true, message: 'Image deleted successfully' };
    } catch (error) {
      console.error('Error deleting unit image:', error);
      throw error;
    }
  },

  /**
   * Set an image as the featured image for a unit
   */
  async setFeaturedImage(imageId: number, unitId: number) {
    try {
      // Check if the image exists and belongs to the unit
      const image = await prisma.unitImage.findFirst({
        where: {
          id: imageId,
          unitId: unitId.toString()
        }
      });

      if (!image) {
        throw new ErrorWithStatus('Image not found or does not belong to this unit', 404);
      }

      // Clear any existing featured images
      await prisma.unitImage.updateMany({
        where: {
          unitId: unitId.toString(),
          isFeatured: true
        },
        data: {
          isFeatured: false
        }
      });

      // Set the specified image as featured
      await prisma.unitImage.update({
        where: {
          id: imageId
        },
        data: {
          isFeatured: true
        }
      });

      return {
        success: true,
        message: 'Featured image set successfully'
      };
    } catch (error) {
      console.error('Error setting featured image:', error);
      throw error;
    }
  }
};

/**
 * Utility functions for image processing
 */
export const imageProcessingService = {
  /**
   * Process an image to create thumbnails and medium-sized versions
   */
  async processImage(
    inputPath: string,
    outputDir: string,
    filename: string,
    options = {
      createThumbnail: true,
      createMedium: true,
      thumbnailWidth: 200,
      mediumWidth: 800,
      quality: 80
    }
  ): Promise<ProcessedImage> {
    try {
      // Create output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const fileNameWithoutExt = path.parse(filename).name;
      const fileExt = path.parse(filename).ext;
      
      const result: ProcessedImage = {
        original: inputPath,
        thumbnail: null,
        medium: null
      };

      // Create thumbnail if requested
      if (options.createThumbnail) {
        const thumbnailPath = path.join(outputDir, `${fileNameWithoutExt}_thumb${fileExt}`);
        
        await sharp(inputPath)
          .resize(options.thumbnailWidth)
          .jpeg({ quality: options.quality })
          .toFile(thumbnailPath);
          
        result.thumbnail = thumbnailPath;
      }

      // Create medium-sized image if requested
      if (options.createMedium) {
        const mediumPath = path.join(outputDir, `${fileNameWithoutExt}_medium${fileExt}`);
        
        await sharp(inputPath)
          .resize(options.mediumWidth)
          .jpeg({ quality: options.quality })
          .toFile(mediumPath);
          
        result.medium = mediumPath;
      }

      return result;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  },

  /**
   * Optimize an image to reduce file size
   */
  async optimizeImage(
    inputPath: string,
    outputPath: string,
    options = {
      quality: 80,
      format: 'jpeg' as 'jpeg' | 'png' | 'webp'
    }
  ): Promise<{ path: string, size: number }> {
    try {
      let processor = sharp(inputPath);
      
      switch (options.format) {
        case 'jpeg':
          processor = processor.jpeg({ quality: options.quality });
          break;
        case 'png':
          processor = processor.png({ quality: options.quality });
          break;
        case 'webp':
          processor = processor.webp({ quality: options.quality });
          break;
      }
      
      await processor.toFile(outputPath);
      
      // Get the size of the optimized file
      const stats = fs.statSync(outputPath);
      
      return {
        path: outputPath,
        size: stats.size
      };
    } catch (error) {
      console.error('Error optimizing image:', error);
      throw error;
    }
  }
};

export default {
  propertyImageService,
  unitImageService,
  imageProcessingService
}; 