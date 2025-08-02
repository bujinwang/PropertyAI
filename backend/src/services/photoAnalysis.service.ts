import {
  RekognitionClient,
  DetectLabelsCommand,
  DetectTextCommand,
  DetectFacesCommand,
  DetectModerationLabelsCommand,
} from "@aws-sdk/client-rekognition";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from "@prisma/client";

// Basic logger implementation
const logger = {
  error: (message: string, error?: any) => {
    console.error(message, error);
  },
  warn: (message: string, error?: any) => {
    console.warn(message, error);
  },
  info: (message: string) => {
    console.log(message);
  },
};

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
    priority: "low" | "medium" | "high";
    estimatedCost?: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface PropertyCondition {
  room: string;
  condition: "excellent" | "good" | "fair" | "poor";
  issues: Array<{
    type: string;
    severity: "minor" | "moderate" | "major";
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
  private rekognition: RekognitionClient;
  private s3: S3Client;
  private readonly BUCKET_NAME =
    process.env.AWS_S3_BUCKET_NAME || "propertyflow-images";

  constructor() {
    const awsConfig = {
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      region: process.env.AWS_REGION || "us-east-1",
    };

    this.rekognition = new RekognitionClient(awsConfig);
    this.s3 = new S3Client(awsConfig);
  }

  async analyzePropertyPhoto(
    request: PhotoUploadRequest
  ): Promise<ImageAnalysis> {
    try {
      // Upload image to S3
      const imageKey = await this.uploadImageToS3(
        request.file,
        request.propertyId
      );
      const imageUrl = `https://${this.BUCKET_NAME}.s3.amazonaws.com/${imageKey}`;

      // Analyze image with Rekognition
      const analysis = await this.performRekognitionAnalysis(imageKey);

      // Generate recommendations based on analysis
      const recommendations = await this.generateRecommendations(
        analysis,
        request.roomType
      );

      const imageAnalysis: ImageAnalysis = {
        id: uuidv4(),
        propertyId: request.propertyId,
        imageUrl,
        analysis,
        recommendations,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store analysis results in database
      await this.storeAnalysisResult(request.propertyId, imageAnalysis);

      return imageAnalysis;
    } catch (error) {
      logger.error("Photo analysis error:", error);
      throw new Error(
        `Failed to analyze property photo: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async uploadImageToS3(
    file: Express.Multer.File,
    propertyId: string
  ): Promise<string> {
    const key = `properties/${propertyId}/photos/${uuidv4()}-${
      file.originalname
    }`;

    // Optimize image with Sharp
    const optimizedBuffer = await sharp(file.buffer)
      .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const command = new PutObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: key,
      Body: optimizedBuffer,
      ContentType: "image/jpeg",
    });

    await this.s3.send(command);
    return key;
  }

  private async performRekognitionAnalysis(imageKey: string) {
    const imageBytes = await this.getImageBytes(imageKey);

    // Detect labels (objects, scenes, concepts)
    const labelCommand = new DetectLabelsCommand({
      Image: { Bytes: imageBytes },
      MaxLabels: 50,
      MinConfidence: 70,
    });
    const labelDetection = await this.rekognition.send(labelCommand);

    // Detect text
    const textCommand = new DetectTextCommand({
      Image: { Bytes: imageBytes },
    });
    const textDetection = await this.rekognition.send(textCommand);

    // Detect faces
    const faceCommand = new DetectFacesCommand({
      Image: { Bytes: imageBytes },
      Attributes: ["ALL"],
    });
    const faceDetection = await this.rekognition.send(faceCommand);

    // Detect moderation labels
    const moderationCommand = new DetectModerationLabelsCommand({
      Image: { Bytes: imageBytes },
      MinConfidence: 60,
    });
    const moderation = await this.rekognition.send(moderationCommand);

    // Image quality analysis
    const quality = await this.analyzeImageQuality(imageBytes);

    return {
      labels:
        labelDetection.Labels?.map((label) => ({
          name: label.Name!,
          confidence: label.Confidence!,
          boundingBox: label.Instances?.[0]?.BoundingBox
            ? {
                width: label.Instances[0].BoundingBox.Width!,
                height: label.Instances[0].BoundingBox.Height!,
                left: label.Instances[0].BoundingBox.Left!,
                top: label.Instances[0].BoundingBox.Top!,
              }
            : undefined,
        })) || [],
      text:
        textDetection.TextDetections?.filter((t) => t.Type === "LINE").map(
          (text) => ({
            text: text.DetectedText!,
            confidence: text.Confidence!,
            boundingBox: text.Geometry?.BoundingBox
              ? {
                  width: text.Geometry.BoundingBox.Width!,
                  height: text.Geometry.BoundingBox.Height!,
                  left: text.Geometry.BoundingBox.Left!,
                  top: text.Geometry.BoundingBox.Top!,
                }
              : undefined,
          })
        ) || [],
      faces:
        faceDetection.FaceDetails?.map((face) => ({
          ageRange: {
            low: face.AgeRange?.Low || 0,
            high: face.AgeRange?.High || 0,
          },
          gender: {
            value: face.Gender?.Value || "Unknown",
            confidence: face.Gender?.Confidence || 0,
          },
          emotions: (face.Emotions || []).map((emotion) => ({
            type: emotion.Type || "UNKNOWN",
            confidence: emotion.Confidence || 0,
          })),
          landmarks: (face.Landmarks || []).map((landmark) => ({
            type: landmark.Type || "UNKNOWN",
            x: landmark.X || 0,
            y: landmark.Y || 0,
          })),
        })) || [],
      quality,
      moderation: {
        isSafe:
          !moderation.ModerationLabels ||
          moderation.ModerationLabels.length === 0,
        moderationLabels:
          moderation.ModerationLabels?.map((label) => ({
            name: label.Name!,
            confidence: label.Confidence!,
          })) || [],
      },
    };
  }

  private async analyzeImageQuality(imageBytes: Buffer) {
    try {
      const command = new DetectFacesCommand({
        Image: { Bytes: imageBytes },
        Attributes: ["ALL"],
      });
      const response = await this.rekognition.send(command);

      if (response.FaceDetails && response.FaceDetails.length > 0) {
        const quality = response.FaceDetails[0].Quality;
        return {
          brightness: quality?.Brightness || 0,
          sharpness: quality?.Sharpness || 0,
          contrast: 0,
        };
      }

      // Fallback quality estimation
      const image = sharp(imageBytes);
      const stats = await image.stats();

      // Calculate brightness from histogram
      const brightness = stats.channels[0].mean / 255;
      const sharpness = (stats.channels[0] as any).standardDeviation / 128;

      return {
        brightness: Math.min(1, Math.max(0, brightness)),
        sharpness: Math.min(1, Math.max(0, sharpness)),
        contrast: stats.channels[0].mean / 255,
      };
    } catch (error) {
      logger.warn("Quality analysis failed:", error);
      return { brightness: 0.5, sharpness: 0.5, contrast: 0.5 };
    }
  }

  private async getImageBytes(imageKey: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: imageKey,
    });

    const response = await this.s3.send(command);
    const chunks: Uint8Array[] = [];

    if (response.Body) {
      const stream = response.Body as any;
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
    }

    return Buffer.concat(chunks);
  }

  private async generateRecommendations(analysis: any, roomType?: string) {
    const recommendations = [];

    // Check for maintenance issues
    const maintenanceLabels = [
      "Rust",
      "Crack",
      "Dirt",
      "Stain",
      "Damage",
      "Broken",
    ];
    const foundIssues = analysis.labels.filter((label: { name: string }) =>
      maintenanceLabels.some((issue) =>
        label.name.toLowerCase().includes(issue.toLowerCase())
      )
    );

    foundIssues.forEach((issue: { name: string; confidence: number }) => {
      recommendations.push({
        type: "maintenance",
        description: `Address ${issue.name.toLowerCase()} detected in image`,
        priority:
          issue.confidence > 90 ? ("high" as const) : ("medium" as const),
        estimatedCost: this.estimateMaintenanceCost(issue.name),
      });
    });

    // Check for amenities
    const amenityLabels = [
      "Pool",
      "Gym",
      "Parking",
      "Garden",
      "Balcony",
      "Fireplace",
    ];
    const amenities = analysis.labels.filter((label: { name: string }) =>
      amenityLabels.some((amenity) =>
        label.name.toLowerCase().includes(amenity.toLowerCase())
      )
    );

    amenities.forEach((amenity: { name: string }) => {
      recommendations.push({
        type: "highlight",
        description: `Feature ${amenity.name.toLowerCase()} in listing description`,
        priority: "low" as const,
      });
    });

    // Check image quality
    if (analysis.quality.brightness < 0.3) {
      recommendations.push({
        type: "quality",
        description:
          "Image appears too dark - consider retaking with better lighting",
        priority: "medium" as const,
      });
    }

    if (analysis.quality.sharpness < 0.3) {
      recommendations.push({
        type: "quality",
        description:
          "Image appears blurry - consider retaking with better focus",
        priority: "medium" as const,
      });
    }

    // Room-specific recommendations
    if (roomType) {
      recommendations.push(
        ...this.getRoomSpecificRecommendations(roomType, analysis)
      );
    }

    return recommendations;
  }

  private getRoomSpecificRecommendations(roomType: string, analysis: any) {
    const recommendations = [];

    switch (roomType.toLowerCase()) {
      case "kitchen":
        const kitchenLabels = ["Stove", "Refrigerator", "Cabinet", "Counter"];
        const hasEssential = analysis.labels.some((label: { name: string }) =>
          kitchenLabels.some((item) =>
            label.name.toLowerCase().includes(item.toLowerCase())
          )
        );
        if (!hasEssential) {
          recommendations.push({
            type: "feature",
            description: "Consider highlighting kitchen appliances and storage",
            priority: "low" as const,
          });
        }
        break;

      case "bathroom":
        const bathroomLabels = ["Toilet", "Sink", "Shower", "Bathtub"];
        const hasBathroomEssential = analysis.labels.some(
          (label: { name: string }) =>
            bathroomLabels.some((item) =>
              label.name.toLowerCase().includes(item.toLowerCase())
            )
        );
        if (!hasBathroomEssential) {
          recommendations.push({
            type: "feature",
            description: "Ensure all bathroom fixtures are visible and clean",
            priority: "medium" as const,
          });
        }
        break;

      case "bedroom":
        const bedroomLabels = ["Bed", "Closet", "Window", "Lamp"];
        const hasBedroomEssential = analysis.labels.some(
          (label: { name: string }) =>
            bedroomLabels.some((item) =>
              label.name.toLowerCase().includes(item.toLowerCase())
            )
        );
        if (!hasBedroomEssential) {
          recommendations.push({
            type: "feature",
            description: "Consider staging bedroom with essential furniture",
            priority: "low" as const,
          });
        }
        break;
    }

    return recommendations;
  }

  private estimateMaintenanceCost(issue: string): number {
    const costMap = {
      rust: 150,
      crack: 200,
      dirt: 50,
      stain: 75,
      damage: 300,
      broken: 250,
    };

    const lowerIssue = issue.toLowerCase();
    for (const [key, cost] of Object.entries(costMap)) {
      if (lowerIssue.includes(key)) {
        return cost;
      }
    }

    return 100; // Default cost
  }

  async storeAnalysisResult(
    maintenanceRequestId: string,
    analysisData: any
  ): Promise<void> {
    try {
      await prisma.photoAnalysis.create({
        data: {
          maintenanceRequestId: maintenanceRequestId,
          analysisResult: analysisData,
        },
      });
    } catch (error) {
      logger.error("Error storing analysis result:", error);
      throw new Error("Failed to store analysis result.");
    }
  }

  async analyzePropertyPhotos(
    photos: PhotoUploadRequest[]
  ): Promise<PropertyCondition[]> {
    const conditions: PropertyCondition[] = [];

    for (const photo of photos) {
      const analysis = await this.analyzePropertyPhoto(photo);
      const roomCondition = this.extractRoomCondition(analysis, photo.roomType);
      conditions.push(roomCondition);
    }

    return conditions;
  }

  private extractRoomCondition(
    analysis: ImageAnalysis,
    roomType?: string
  ): PropertyCondition {
    const condition = this.assessOverallCondition(analysis.analysis);
    const issues = this.identifyIssues(analysis.analysis);
    const amenities = this.identifyAmenities(analysis.analysis);

    return {
      room: roomType || "general",
      condition,
      issues,
      amenities,
      recommendations: analysis.recommendations.map((r) => r.description),
    };
  }

  private assessOverallCondition(
    analysis: any
  ): "excellent" | "good" | "fair" | "poor" {
    const issueCount = analysis.labels.filter((label: { name: string }) =>
      ["Rust", "Crack", "Dirt", "Stain", "Damage"].some((issue) =>
        label.name.toLowerCase().includes(issue.toLowerCase())
      )
    ).length;

    if (issueCount === 0) return "excellent";
    if (issueCount <= 2) return "good";
    if (issueCount <= 5) return "fair";
    return "poor";
  }

  private identifyIssues(analysis: any) {
    const issueTypes = [
      "Rust",
      "Crack",
      "Dirt",
      "Stain",
      "Damage",
      "Broken",
      "Mold",
    ];
    return analysis.labels
      .filter((label: { name: string; confidence: number }) =>
        issueTypes.some((issue) =>
          label.name.toLowerCase().includes(issue.toLowerCase())
        )
      )
      .map((label: { name: string; confidence: number }) => ({
        type: label.name,
        severity:
          label.confidence > 90
            ? ("major" as const)
            : label.confidence > 70
            ? ("moderate" as const)
            : ("minor" as const),
        description: `${label.name} detected in image`,
        location: { x: 0.5, y: 0.5 }, // Default center position
      }));
  }

  private identifyAmenities(analysis: any) {
    const amenityTypes = [
      "Pool",
      "Gym",
      "Parking",
      "Garden",
      "Balcony",
      "Fireplace",
      "Stove",
      "Refrigerator",
    ];
    return analysis.labels
      .filter((label: { name: string }) =>
        amenityTypes.some((amenity) =>
          label.name.toLowerCase().includes(amenity.toLowerCase())
        )
      )
      .map((label: { name: string }) => label.name);
  }
}

export const photoAnalysisService = new PhotoAnalysisService();

// Export individual functions for compatibility
export const analyzeImage = (request: PhotoUploadRequest) =>
  photoAnalysisService.analyzePropertyPhoto(request);
export const storeAnalysisResult = (
  maintenanceRequestId: string,
  analysisData: any
) =>
  photoAnalysisService["storeAnalysisResult"](
    maintenanceRequestId,
    analysisData
  );
