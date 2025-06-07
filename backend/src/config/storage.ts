import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

// Load environment variables
const isProduction = process.env.NODE_ENV === 'production';
const useS3 = isProduction || process.env.USE_S3 === 'true';

// Create local upload directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Sub-directories for different types of uploads
const propertyImagesDir = path.join(uploadDir, 'properties');
const unitImagesDir = path.join(uploadDir, 'units');
const documentsDir = path.join(uploadDir, 'documents');
const userImagesDir = path.join(uploadDir, 'users');

// Create sub-directories if they don't exist
[propertyImagesDir, unitImagesDir, documentsDir, userImagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// S3 Configuration
let s3Client: S3Client | null = null;

if (useS3) {
  // Initialize S3 client
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
  });
}

// Configuration for different storage types
const storageOptions = {
  s3: {
    bucket: process.env.AWS_S3_BUCKET || 'propertyai-uploads',
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req: Express.Request, file: Express.Multer.File, cb: any) => {
      cb(null, { fieldName: file.fieldname });
    }
  },
  local: {
    destination: uploadDir
  }
};

// File filter to only allow certain file types
const fileFilter = (
  req: Express.Request, 
  file: Express.Multer.File, 
  cb: multer.FileFilterCallback
) => {
  // Allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocumentTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  // Check file type based on upload category
  const category = (req as any).params?.category || 'images';
  
  if (category === 'images' || category === 'properties' || category === 'units' || category === 'users') {
    if (allowedImageTypes.includes(file.mimetype)) {
      return cb(null, true);
    } else {
      return cb(new Error('Only image files are allowed for this category!'));
    }
  } else if (category === 'documents') {
    if ([...allowedImageTypes, ...allowedDocumentTypes].includes(file.mimetype)) {
      return cb(null, true);
    } else {
      return cb(new Error('Only image or document files are allowed for this category!'));
    }
  } else {
    return cb(new Error('Invalid upload category!'));
  }
};

// Function to generate unique filenames
const generateFilename = (file: Express.Multer.File, category: string): string => {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  return `${category}_${uniqueId}_${timestamp}${fileExtension}`;
};

// Create storage engine based on environment
const createStorageEngine = (category: string = 'general') => {
  if (useS3 && s3Client) {
    return multerS3({
      s3: s3Client,
      bucket: storageOptions.s3.bucket,
      acl: storageOptions.s3.acl as any,
      contentType: storageOptions.s3.contentType,
      metadata: storageOptions.s3.metadata,
      key: (req: Express.Request, file: Express.Multer.File, cb: any) => {
        const filename = generateFilename(file, category);
        cb(null, `${category}/${filename}`);
      }
    });
  } else {
    // Local disk storage
    return multer.diskStorage({
      destination: (req: Express.Request, file: Express.Multer.File, cb: any) => {
        let destinationDir = uploadDir;
        
        switch (category) {
          case 'properties':
            destinationDir = propertyImagesDir;
            break;
          case 'units':
            destinationDir = unitImagesDir;
            break;
          case 'documents':
            destinationDir = documentsDir;
            break;
          case 'users':
            destinationDir = userImagesDir;
            break;
        }
        
        cb(null, destinationDir);
      },
      filename: (req: Express.Request, file: Express.Multer.File, cb: any) => {
        const filename = generateFilename(file, category);
        cb(null, filename);
      }
    });
  }
};

// Configure multer for different upload types
export const configureUpload = (category: string, maxFileSize: number = 5 * 1024 * 1024) => {
  return multer({
    storage: createStorageEngine(category),
    limits: {
      fileSize: maxFileSize // default 5MB
    },
    fileFilter: fileFilter
  });
};

// Helper to get full URL for an uploaded file
export const getFileUrl = (filename: string, category: string): string => {
  if (useS3) {
    const bucketName = storageOptions.s3.bucket;
    const region = process.env.AWS_REGION || 'us-east-1';
    return `https://${bucketName}.s3.${region}.amazonaws.com/${category}/${filename}`;
  } else {
    // For local development, use the server's URL
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    return `${serverUrl}/uploads/${category}/${filename}`;
  }
};

// Helper function to delete a file
export const deleteFile = async (filename: string, category: string): Promise<boolean> => {
  try {
    if (useS3 && s3Client) {
      // Delete from S3
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const deleteParams = {
        Bucket: storageOptions.s3.bucket,
        Key: `${category}/${filename}`
      };
      
      await s3Client.send(new DeleteObjectCommand(deleteParams));
    } else {
      // Delete from local filesystem
      let filePath = '';
      
      switch (category) {
        case 'properties':
          filePath = path.join(propertyImagesDir, filename);
          break;
        case 'units':
          filePath = path.join(unitImagesDir, filename);
          break;
        case 'documents':
          filePath = path.join(documentsDir, filename);
          break;
        case 'users':
          filePath = path.join(userImagesDir, filename);
          break;
        default:
          filePath = path.join(uploadDir, category, filename);
      }
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

export default {
  configureUpload,
  getFileUrl,
  deleteFile,
  isS3Enabled: useS3
}; 