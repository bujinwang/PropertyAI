import { Schema, model, Document } from 'mongoose';

// Interface for AI-generated content
export interface IAiContent extends Document {
  sourceId: string; // ID of the property or unit
  sourceType: 'Property' | 'Unit';
  content: {
    description: string;
    smartPricing: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema for AI-generated content
const AiContentSchema = new Schema<IAiContent>({
  sourceId: { type: String, required: true },
  sourceType: { type: String, required: true, enum: ['Property', 'Unit'] },
  content: {
    description: { type: String, required: true },
    smartPricing: { type: Number, required: true },
  },
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
