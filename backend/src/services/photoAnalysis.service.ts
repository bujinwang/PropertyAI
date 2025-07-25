import AWS from 'aws-sdk';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface ImageAnalysis {
  id: string;
  propertyId: string;
  imageUrl: string;
  analysis: {
    labels: Array<{
      name: string;
      confidence: number;
      boundingBox?: {
        width: number;
        height: number;
        left: number;
        top: number;
      };
    }>;
    text: Array<{
      text: string;
      confidence: number;
      boundingBox?: {
        width: number;
        height: number;
        left: number;
        top: number;
      };
    }>;
    faces: Array<{
      ageRange: { low: number; high: number };
      gender: { value: string; confidence: number };
      emotions: Array<{ type: string; confidence: number }>;
      landmarks: Array<{ type: string; x: number; y: number }>;
    }>;
    quality: {
      brightness: number;
      sharpness: number;
      contrast: number;
    };
    moderation: {
      isSafe: boolean;
      moderationLabels: Array<{ name: string; confidence: number }>;
    };
  };
  recommendations: Array<{
    type: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    estimatedCost?: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface PropertyCondition {
  room: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  issues: Array<{
    type: string;
    severity: 'minor' | 'moderate' | 'major';
    description: string;
    location: { x: number; y: number };
  }>;
  amenities: string[];
  recommendations: string[];
}

interface PhotoUploadRequest {
  propertyId: string;
  file: Express.Multer.File;
  roomType?: string;
  description?: string;
}

class PhotoAnalysisService {
  private rekognition: AWS.Rekognition;
  private s3: AWS.S3;
  private readonly BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'propertyflow-images';

  constructor() {
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    this.rekognition = new AWS.Rekognition();
    this.s3 = new AWS.S3();
  }

  async analyzePropertyPhoto(request: PhotoUploadRequest): Promise<ImageAnalysis> {
    try {
      // Upload image to S3
      const imageKey = await this.uploadImageToS3(request.file, request.propertyId);
      const imageUrl = `https://${this.BUCKET_NAME}.s3.amazonaws.com/${imageKey}`;

      // Analyze image with Rekognition
      const analysis = await this.performRekognitionAnalysis(imageKey);

      // Generate recommendations based on analysis
      const recommendations = await this.generateRecommendations(analysis, request.roomType);

      const imageAnalysis: ImageAnalysis = {
        id: uuidv4(),
        propertyId: request.propertyId,
        imageUrl,
        analysis,
        recommendations,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store analysis results in database
      await this.storeAnalysisResult(imageAnalysis);
      
      return imageAnalysis;
    } catch (error) {
      logger.error('Photo analysis error:', error);
      throw new Error(`Failed to analyze property photo: ${error.message}`);
    }
  }

  private async uploadImageToS3(file: Express.Multer.File, propertyId: string): Promise<string> {
    const key = `properties/${propertyId}/photos/${uuidv4()}-${file.originalname}`;
    
    // Optimize image with Sharp
    const optimizedBuffer = await sharp(file.buffer)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const params = {
      Bucket: this.BUCKET_NAME,
      Key: key,
      Body: optimizedBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    };

    await this.s3.upload(params).promise();
    return key;
  }

  private async performRekognitionAnalysis(imageKey: string) {
    const imageBytes = await this.getImageBytes(imageKey);

    // Detect labels (objects, scenes, concepts)
    const labelDetection = await this.rekognition.detectLabels({
      Image: { Bytes: imageBytes },
      MaxLabels: 50,
      MinConfidence: 70
    }).promise();

    // Detect text
    const textDetection = await this.rekognition.detectText({
      Image: { Bytes: imageBytes }
    }).promise();

    // Detect faces
    const faceDetection = await this.rekognition.detectFaces({
      Image: { Bytes: imageBytes },
      Attributes: ['ALL']
    }).promise();

    // Detect moderation labels
    const moderation = await this.rekognition.detectModerationLabels({
      Image: { Bytes: imageBytes },
      MinConfidence: 60
    }).promise();

    // Image quality analysis
    const quality = await this.analyzeImageQuality(imageBytes);

    return {
      labels: labelDetection.Labels?.map(label => ({
        name: label.Name!,
        confidence: label.Confidence!,
        boundingBox: label.Instances?.[0]?.BoundingBox
      })) || [],
      text: textDetection.TextDetections?.filter(t => t.Type === 'LINE').map(text => ({
        text: text.DetectedText!,
        confidence: text.Confidence!,
        boundingBox: text.Geometry?.BoundingBox
      })) || [],
      faces: faceDetection.FaceDetails?.map(face => ({
        ageRange: face.AgeRange!,
        gender: face.Gender!,
        emotions: face.Emotions || [],
        landmarks: face.Landmarks || []
      })) || [],
      quality,
      moderation: {
        isSafe: !moderation.ModerationLabels || moderation.ModerationLabels.length === 0,
        moderationLabels: moderation.ModerationLabels?.map(label => ({
          name: label.Name!,
          confidence: label.Confidence!
        })) || []
      }
    };
  }

  private async analyzeImageQuality(imageBytes: Buffer) {
    try {
      const response = await this.rekognition.detectFaces({
        Image: { Bytes: imageBytes },
        Attributes: ['QUALITY']
      }).promise();

      if (response.FaceDetails && response.FaceDetails.length > 0) {
        const quality = response.FaceDetails[0].Quality;
        return {
          brightness: quality?.Brightness || 0,
          sharpness: quality?.Sharpness || 0,
          contrast: 0
        };
      }

      // Fallback quality estimation
      const image = sharp(imageBytes);
      const stats = await image.stats();
      
      // Calculate brightness from histogram
      const brightness = stats.channels[0].mean / 255;
      const sharpness = stats.channels[0].standardDeviation / 128;

      return {
        brightness: Math.min(1, Math.max(0, brightness)),
        sharpness: Math.min(1, Math.max(0, sharpness)),
        contrast: stats.channels[0].mean / 255
      };
    } catch (error) {
      logger.warn('Quality analysis failed:', error);
      return { brightness: 0.5, sharpness: 0.5, contrast: 0.5 };
    }
  }

  private async getImageBytes(imageKey: string): Promise<Buffer> {
    const params = {
      Bucket: this.BUCKET_NAME,
      Key: imageKey
    };
    
    const response = await this.s3.getObject(params).promise();
    return response.Body as Buffer;
  }

  private async generateRecommendations(analysis: any, roomType?: string) {
    const recommendations = [];

    // Check for maintenance issues
    const maintenanceLabels = ['Rust', 'Crack', 'Dirt', 'Stain', 'Damage', 'Broken'];
    const foundIssues = analysis.labels.filter(label => 
      maintenanceLabels.some(issue => label.name.toLowerCase().includes(issue.toLowerCase()))
    );

    foundIssues.forEach(issue => {
      recommendations.push({
        type: 'maintenance',
        description: `Address ${issue.name.toLowerCase()} detected in image`,
        priority: issue.confidence > 90 ? 'high' : 'medium',
        estimatedCost: this.estimateMaintenanceCost(issue.name)
      });
    });

    // Check for amenities
    const amenityLabels = ['Pool', 'Gym', 'Parking', 'Garden', 'Balcony', 'Fireplace'];
    const amenities = analysis.labels.filter(label => 
      amenityLabels.some(amenity => label.name.toLowerCase().includes(amenity.toLowerCase()))
    );

    amenities.forEach(amenity => {
      recommendations.push({
        type: 'highlight',
        description: `Feature ${amenity.name.toLowerCase()} in listing description`,
        priority: 'low'
      });
    });

    // Check image quality
    if (analysis.quality.brightness < 0.3) {
      recommendations.push({
        type: 'quality',
        description: 'Image appears too dark - consider retaking with better lighting',
        priority: 'medium'
      });
    }

    if (analysis.quality.sharpness < 0.3) {
      recommendations.push({
        type: 'quality',
        description: 'Image appears blurry - consider retaking with better focus',
        priority: 'medium'
      });
    }

    // Room-specific recommendations
    if (roomType) {
      recommendations.push(...this.getRoomSpecificRecommendations(roomType, analysis));
    }

    return recommendations;
  }

  private getRoomSpecificRecommendations(roomType: string, analysis: any) {
    const recommendations = [];

    switch (roomType.toLowerCase()) {
      case 'kitchen':
        const kitchenLabels = ['Stove', 'Refrigerator', 'Cabinet', 'Counter'];
        const hasEssential = analysis.labels.some(label => 
          kitchenLabels.some(item => label.name.toLowerCase().includes(item.toLowerCase()))
        );
        if (!hasEssential) {
          recommendations.push({
            type: 'feature',
            description: 'Consider highlighting kitchen appliances and storage',
            priority: 'low'
          });
        }
        break;

      case 'bathroom':
        const bathroomLabels = ['Toilet', 'Sink', 'Shower', 'Bathtub'];
        const hasBathroomEssential = analysis.labels.some(label => 
          bathroomLabels.some(item => label.name.toLowerCase().includes(item.toLowerCase()))
        );
        if (!hasBathroomEssential) {
          recommendations.push({
            type: 'feature',
            description: 'Ensure all bathroom fixtures are visible and clean',
            priority: 'medium'
          });
        }
        break;

      case 'bedroom':
        const bedroomLabels = ['Bed', 'Closet', 'Window', 'Lamp'];
        const hasBedroomEssential = analysis.labels.some(label => 
          bedroomLabels.some(item => label.name.toLowerCase().includes(item.toLowerCase()))
        );
        if (!hasBedroomEssential) {
          recommendations.push({
            type: 'feature',
            description: 'Consider staging bedroom with essential furniture',
            priority: 'low'
          });
        }
        break;
    }

    return recommendations;
  }

  private estimateMaintenanceCost(issue: string): number {
    const costMap = {
      'rust': 150,
      'crack': 200,
      'dirt': 50,
      'stain': 75,
      'damage': 300,
      'broken': 250
    };

    const lowerIssue = issue.toLowerCase();
    for (const [key, cost] of Object.entries(costMap)) {
      if (lowerIssue.includes(key)) {
        return cost;
      }
    }

    return 100; // Default cost
  }

  private async storeAnalysisResult(imageAnalysis: ImageAnalysis): Promise<void> {
    try {
      await prisma.photoAnalysis.create({
        data: {
          propertyId: imageAnalysis.propertyId,
          imageUrl: imageAnalysis.imageUrl,
          analysis: imageAnalysis.analysis,
          recommendations: imageAnalysis.recommendations,
          createdAt: imageAnalysis.createdAt,
          updatedAt: imageAnalysis.updatedAt
        }
      });
    } catch (error) {
      logger.error('Error storing analysis result:', error);
      throw new Error('Failed to store analysis result.');
    }
  }

  async analyzePropertyPhotos(photos: PhotoUploadRequest[]): Promise<PropertyCondition[]> {
    const conditions: PropertyCondition[] = [];

    for (const photo of photos) {
      const analysis = await this.analyzePropertyPhoto(photo);
      const roomCondition = this.extractRoomCondition(analysis, photo.roomType);
      conditions.push(roomCondition);
    }

    return conditions;
  }

  private extractRoomCondition(analysis: ImageAnalysis, roomType?: string): PropertyCondition {
    const condition = this.assessOverallCondition(analysis.analysis);
    const issues = this.identifyIssues(analysis.analysis);
    const amenities = this.identifyAmenities(analysis.analysis);

    return {
      room: roomType || 'general',
      condition,
      issues,
      amenities,
      recommendations: analysis.recommendations.map(r => r.description)
    };
  }

  private assessOverallCondition(analysis: any): 'excellent' | 'good' | 'fair' | 'poor' {
    const issueCount = analysis.labels.filter(label => 
      ['Rust', 'Crack', 'Dirt', 'Stain', 'Damage'].some(issue => 
        label.name.toLowerCase().includes(issue.toLowerCase())
      )
    ).length;

    if (issueCount === 0) return 'excellent';
    if (issueCount <= 2) return 'good';
    if (issueCount <= 5) return 'fair';
    return 'poor';
  }

  private identifyIssues(analysis: any) {
    const issueTypes = ['Rust', 'Crack', 'Dirt', 'Stain', 'Damage', 'Broken', 'Mold'];
    return analysis.labels
      .filter(label => issueTypes.some(issue => 
        label.name.toLowerCase().includes(issue.toLowerCase())
      ))
      .map(label => ({
        type: label.name,
        severity: label.confidence > 90 ? 'major' : label.confidence > 70 ? 'moderate' : 'minor',
        description: `${label.name} detected in image`,
        location: { x: 0.5, y: 0.5 } // Default center position
      }));
  }

  private identifyAmenities(analysis: any) {
    const amenityTypes = ['Pool', 'Gym', 'Parking', 'Garden', 'Balcony', 'Fireplace', 'Stove', 'Refrigerator'];
    return analysis.labels
      .filter(label => amenityTypes.some(amenity => 
        label.name.toLowerCase().includes(amenity.toLowerCase())
      ))
      .map(label => label.name);
  }
}

export const photoAnalysisService = new PhotoAnalysisService();
