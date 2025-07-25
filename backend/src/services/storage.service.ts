import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { cloudFrontService } from './cloudfront.service';

interface UploadOptions {
  bucket?: string;
  folder?: string;
  maxSize?: number;
  allowedTypes?: string[];
  resize?: {
    width?: number;
    height?: number;
    quality?: number;
  };
  generateThumbnail?: boolean;
  thumbnailSize?: { width: number; height: number };
  generateCDN?: boolean;
}

interface FileUploadResult {
  key: string;
  url: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  thumbnailCDNUrl?: string;
  size: number;
  mimeType: string;
  originalName: string;
}

interface StorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  cloudFrontDomain?: string;
}

class StorageService {
  private s3Client: S3Client;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * Upload a file to S3 with optional processing and CDN support
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    options: UploadOptions = {}
  ): Promise<FileUploadResult> {
    const {
      bucket = this.config.bucket,
      folder = 'uploads',
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      resize,
      generateThumbnail = false,
      thumbnailSize = { width: 300, height: 300 },
      generateCDN = true,
    } = options;

    // Validate file
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} not allowed`);
    }

    const fileName = `${uuidv4()}-${file.originalname}`;
    const key = `${folder}/${userId}/${fileName}`;

    let processedBuffer = file.buffer;
    let mimeType = file.mimetype;

    // Process image files
    if (file.mimetype.startsWith('image/')) {
      const imageProcessor = sharp(file.buffer);

      if (resize) {
        imageProcessor.resize(resize.width, resize.height, { 
          fit: 'inside',
          withoutEnlargement: true 
        });
      }

      if (file.mimetype === 'image/jpeg' && resize?.quality) {
        imageProcessor.jpeg({ quality: resize.quality });
      } else if (file.mimetype === 'image/webp') {
        imageProcessor.webp({ quality: resize?.quality || 80 });
      }

      processedBuffer = await imageProcessor.toBuffer();
    }

    // Upload main file
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: processedBuffer,
        ContentType: mimeType,
        ACL: 'private',
        Metadata: {
          'original-name': file.originalname,
          'uploaded-by': userId,
          'upload-date': new Date().toISOString(),
        },
      },
    });

    await upload.done();

    let thumbnailKey: string | undefined;
    let thumbnailUrl: string | undefined;
    let thumbnailCDNUrl: string | undefined;

    // Generate thumbnail for images
    if (generateThumbnail && file.mimetype.startsWith('image/')) {
      const thumbnailBuffer = await sharp(file.buffer)
        .resize(thumbnailSize.width, thumbnailSize.height, { 
          fit: 'cover',
          position: 'center' 
        })
        .jpeg({ quality: 70 })
        .toBuffer();

      thumbnailKey = `${folder}/${userId}/thumbnails/${fileName}`;
      
      const thumbnailUpload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: bucket,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
          ACL: 'private',
        },
      });

      await thumbnailUpload.done();
      thumbnailUrl = this.getPublicUrl(thumbnailKey);
      
      if (generateCDN && cloudFrontService.isCDNConfigured()) {
        thumbnailCDNUrl = cloudFrontService.getCDNUrl(thumbnailKey);
      }
    }

    const fileUrl = this.getPublicUrl(key);
    const cdnUrl = generateCDN && cloudFrontService.isCDNConfigured() 
      ? cloudFrontService.getCDNUrl(key) 
      : undefined;

    // Save file metadata to database
    const document = await prisma.document.create({
      data: {
        name: file.originalname,
        type: this.getDocumentType(file.mimetype),
        url: fileUrl,
        cdnUrl: cdnUrl,
        key: key,
        thumbnailUrl: thumbnailUrl,
        thumbnailCdnUrl: thumbnailCDNUrl,
        size: processedBuffer.length,
        mimeType: mimeType,
        uploadedById: userId,
      },
    });

    return {
      key,
      url: fileUrl,
      cdnUrl,
      thumbnailUrl,
      thumbnailCDNUrl,
      size: processedBuffer.length,
      mimeType,
      originalName: file.originalname,
    };
  }

  /**
   * Get a pre-signed URL for secure file access
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    await this.s3Client.send(command);

    // Also delete thumbnail if exists
    const thumbnailKey = key.replace(/(\/[^/]+)$/, '/thumbnails$1');
    try {
      const thumbnailCommand = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: thumbnailKey,
      });
      await this.s3Client.send(thumbnailCommand);
    } catch (error) {
      // Thumbnail might not exist, ignore error
    }

    // Delete from database
    await prisma.document.deleteMany({
      where: { key },
    });
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string) {
    const command = new HeadObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    return response;
  }

  /**
   * List files in a folder
   */
  async listFiles(prefix: string, maxKeys: number = 100) {
    const command = new ListObjectsV2Command({
      Bucket: this.config.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await this.s3Client.send(command);
    return response.Contents || [];
  }

  /**
   * Generate CDN URL for public access
   */
  private getPublicUrl(key: string): string {
    if (this.config.cloudFrontDomain) {
      return `https://${this.config.cloudFrontDomain}/${key}`;
    }
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  /**
   * Determine document type from MIME type
   */
  private getDocumentType(mimeType: string) {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    return 'OTHER';
  }

  /**
   * Upload multiple files with optimized processing
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    userId: string,
    options: UploadOptions = {}
  ): Promise<FileUploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, userId, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Create a folder structure
   */
  async createFolder(folderPath: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: `${folderPath}/`,
      Body: Buffer.alloc(0),
      ContentType: 'application/x-directory',
    });

    await this.s3Client.send(command);
  }

  /**
   * Move file to different location
   */
  async moveFile(sourceKey: string, destinationKey: string): Promise<string> {
    // Copy the file
    const copyCommand = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: destinationKey,
      CopySource: `${this.config.bucket}/${sourceKey}`,
    });

    await this.s3Client.send(copyCommand);

    // Update database record
    await prisma.document.updateMany({
      where: { key: sourceKey },
      data: { key: destinationKey },
    });

    // Delete the original
    await this.deleteFile(sourceKey);

    return this.getPublicUrl(destinationKey);
  }

  /**
   * Bulk delete files
   */
  async bulkDelete(keys: string[]): Promise<void> {
    const deletePromises = keys.map(key => this.deleteFile(key));
    await Promise.all(deletePromises);
  }

  /**
   * Generate optimized image variants
   */
  async generateImageVariants(
    file: Express.Multer.File,
    userId: string,
    variants: Array<{ width: number; height: number; suffix: string }>,
    options: Omit<UploadOptions, 'resize'> = {}
  ): Promise<Record<string, FileUploadResult>> {
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Only images can have variants');
    }

    const results: Record<string, FileUploadResult> = {};

    for (const variant of variants) {
      const processedBuffer = await sharp(file.buffer)
        .resize(variant.width, variant.height, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      const variantFile = {
        ...file,
        buffer: processedBuffer,
        originalname: file.originalname.replace(/(\.\w+)$/, `-${variant.suffix}$1`),
      };

      const result = await this.uploadFile(variantFile, userId, options);
      results[variant.suffix] = result;
    }

    return results;
  }
}

// Initialize storage service with environment variables
const storageService = new StorageService({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.AWS_S3_BUCKET_NAME!,
  cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN,
});

export { storageService, StorageService };
export type { UploadOptions, FileUploadResult };