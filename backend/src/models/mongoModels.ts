import { Schema, model, Document } from 'mongoose';

// Interface for AI-generated content
export interface IAiContent extends Document {
  contentId: string;
  contentType: string;
  originalPrompt: string;
  generatedContent: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  modelName: string;
  modelVersion?: string;
  parameters?: Record<string, any>;
  createdBy: string;
  status: 'draft' | 'published' | 'archived';
  tags?: string[];
  usageMetrics?: {
    views: number;
    conversions: number;
    engagement: number;
  };
  feedback?: {
    userId: string;
    rating: number;
    comments?: string;
    timestamp: Date;
  }[];
  revisionHistory?: {
    version: number;
    content: string;
    prompt: string;
    timestamp: Date;
    revisedBy: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema for AI-generated content
const AiContentSchema = new Schema<IAiContent>({
  contentId: { type: String, required: true, unique: true },
  contentType: { type: String, required: true },
  originalPrompt: { type: String, required: true },
  generatedContent: { type: String, required: true },
  relatedEntityId: { type: String },
  relatedEntityType: { type: String },
  modelName: { type: String, required: true },
  modelVersion: { type: String },
  parameters: { type: Schema.Types.Mixed },
  createdBy: { type: String, required: true },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  tags: [String],
  usageMetrics: {
    views: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
  },
  feedback: [{
    userId: { type: String, required: true },
    rating: { type: Number, required: true },
    comments: { type: String },
    timestamp: { type: Date, default: Date.now },
  }],
  revisionHistory: [{
    version: { type: Number, required: true },
    content: { type: String, required: true },
    prompt: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    revisedBy: { type: String, required: true },
  }],
}, {
  timestamps: true,
});

export const AiContent = model<IAiContent>('AiContent', AiContentSchema);

export interface IListingDetails extends Document {
  listingId: string; // Postgres Listing ID
  amenities: string[];
  photos: { url: string; caption: string }[];
  virtualTourUrl?: string;
  floorPlan?: { url: string; description: string };
  communityFeatures?: string[];
  nearbySchools?: { name: string; rating: number }[];
  crimeRate?: any;
  demographics?: any;
}

const ListingDetailsSchema = new Schema<IListingDetails>({
  listingId: { type: String, required: true, unique: true },
  amenities: [String],
  photos: [{ url: String, caption: String }],
  virtualTourUrl: String,
  floorPlan: { url: String, description: String },
  communityFeatures: [String],
  nearbySchools: [{ name: String, rating: Number }],
  crimeRate: Schema.Types.Mixed,
  demographics: Schema.Types.Mixed,
}, { timestamps: true });

export const ListingDetails = model<IListingDetails>('ListingDetails', ListingDetailsSchema);

export interface IApplicationDetails extends Document {
  applicationId: string; // Postgres Application ID
  applicantInfo: {
    previousAddresses: { address: string; duration: string }[];
    employmentHistory: { employer: string; position: string; duration: string }[];
  };
  creditReport: any;
  backgroundCheck: any;
  references: { name: string; relationship: string; contact: string }[];
}

const ApplicationDetailsSchema = new Schema<IApplicationDetails>({
  applicationId: { type: String, required: true, unique: true },
  applicantInfo: {
    previousAddresses: [{ address: String, duration: String }],
    employmentHistory: [{ employer: String, position: String, duration: String }],
  },
  creditReport: Schema.Types.Mixed,
  backgroundCheck: Schema.Types.Mixed,
  references: [{ name: String, relationship: String, contact: String }],
}, { timestamps: true });

export const ApplicationDetails = model<IApplicationDetails>('ApplicationDetails', ApplicationDetailsSchema);
