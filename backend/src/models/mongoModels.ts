import mongoose, { Schema, Document } from 'mongoose';

// Message document interface
export interface IMessage extends Document {
  content: string;
  senderId: string;
  receiverId: string;
  sentAt: Date;
  readAt?: Date;
  maintenanceRequestId?: string;
  attachments?: string[];
  isAIGenerated?: boolean;
  sentiment?: string;
  conversationId?: string;
}

// Maintenance Record document interface
export interface IMaintenanceRecord extends Document {
  maintenanceRequestId: string; // Reference to PostgreSQL
  notes: string[];
  images: string[];
  analytics?: object;
}

// Communication template interface
export interface ICommunicationTemplate extends Document {
  name: string;
  category: string;
  subject: string;
  content: string;
  variables: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// AI Chatbot conversation interface
export interface IChatbotConversation extends Document {
  userId: string;
  conversationId: string;
  messages: {
    role: string;
    content: string;
    timestamp: Date;
  }[];
  context: {
    propertyId?: string;
    unitId?: string;
    maintenanceRequestId?: string;
    leaseId?: string;
  };
  startedAt: Date;
  endedAt?: Date;
  status: string;
  sentiment?: string;
  resolved?: boolean;
  resolutionSummary?: string;
}

// Property Analytics interface
export interface IPropertyAnalytics extends Document {
  propertyId: string;
  timestamp: Date;
  occupancyRate: number;
  averageRent: number;
  maintenanceCosts: number;
  revenue: number;
  expenses: number;
  netIncome: number;
  historicalData: {
    date: Date;
    occupancyRate: number;
    revenue: number;
    expenses: number;
    netIncome: number;
  }[];
  predictions: {
    date: Date;
    occupancyRate: number;
    revenue: number;
    expenses: number;
    netIncome: number;
    confidence: number;
  }[];
  marketComparisons: {
    metric: string;
    propertyValue: number;
    marketAverage: number;
    percentDifference: number;
  }[];
}

// Listing interface for property listings
export interface IListing extends Document {
  propertyId: string;
  unitId?: string;
  title: string;
  description: string;
  aiGeneratedDescription?: string;
  price: number;
  priceHistory: {
    date: Date;
    price: number;
    reason?: string;
  }[];
  suggestedPrice?: number;
  status: string;
  features: string[];
  amenities: string[];
  images: {
    url: string;
    caption?: string;
    isPrimary: boolean;
    isEnhanced: boolean;
    originalUrl?: string;
  }[];
  virtualTour?: string;
  floorPlan?: string;
  dateAvailable: Date;
  dateCreated: Date;
  dateUpdated: Date;
  externalListings: {
    platform: string;
    url: string;
    status: string;
    datePublished: Date;
    externalId?: string;
  }[];
  views: number;
  inquiries: number;
  seoKeywords: string[];
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
  showingSchedule?: {
    availableDates: Date[];
    duration: number;
    instructions?: string;
  };
}

// Application interface for tenant applications
export interface IApplication extends Document {
  applicantId: string;
  propertyId: string;
  unitId: string;
  listingId?: string;
  status: string;
  submittedAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: Date;
    ssn?: string;
    currentAddress: string;
    moveInDate: Date;
  };
  employmentInfo: {
    employer: string;
    position: string;
    income: number;
    startDate: Date;
    supervisorName?: string;
    supervisorContact?: string;
    employmentDocuments: string[];
  };
  rentalHistory: {
    address: string;
    landlordName: string;
    landlordContact: string;
    monthlyRent: number;
    moveInDate: Date;
    moveOutDate?: Date;
    reasonForLeaving?: string;
  }[];
  references: {
    name: string;
    relationship: string;
    contact: string;
  }[];
  creditCheck?: {
    score: number;
    reportUrl?: string;
    issueDate: Date;
  };
  backgroundCheck?: {
    status: string;
    reportUrl?: string;
    issueDate: Date;
    flags?: string[];
  };
  documents: string[];
  notes: string[];
  aiRiskAssessment?: {
    score: number;
    factors: {
      factor: string;
      impact: string;
      weight: number;
    }[];
    recommendation: string;
    confidence: number;
  };
}

// AI Generated Content interface
export interface IAIGeneratedContent extends Document {
  contentId: string;
  contentType: string;
  originalPrompt: string;
  generatedContent: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  modelName: string;
  modelVersion?: string;
  parameters?: object;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  status: string;
  feedback?: {
    userId: string;
    rating: number;
    comments?: string;
    timestamp: Date;
  }[];
  revisionHistory?: {
    version: number;
    content: string;
    prompt?: string;
    timestamp: Date;
    revisedBy?: string;
  }[];
  tags: string[];
  usageMetrics?: {
    views: number;
    conversions: number;
    engagement: number;
  };
}

// Define schemas
const MessageSchema = new Schema<IMessage>({
  content: { type: String, required: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  readAt: { type: Date },
  maintenanceRequestId: { type: String },
  attachments: [{ type: String }],
  isAIGenerated: { type: Boolean, default: false },
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative', 'urgent'] },
  conversationId: { type: String },
});

const MaintenanceRecordSchema = new Schema<IMaintenanceRecord>({
  maintenanceRequestId: { type: String, required: true },
  notes: [{ type: String }],
  images: [{ type: String }],
  analytics: { type: Schema.Types.Mixed },
});

const CommunicationTemplateSchema = new Schema<ICommunicationTemplate>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  subject: { type: String },
  content: { type: String, required: true },
  variables: [{ type: String }],
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

const ChatbotConversationSchema = new Schema<IChatbotConversation>({
  userId: { type: String, required: true },
  conversationId: { type: String, required: true, unique: true },
  messages: [{
    role: { type: String, enum: ['user', 'bot'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  context: {
    propertyId: { type: String },
    unitId: { type: String },
    maintenanceRequestId: { type: String },
    leaseId: { type: String }
  },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'escalated', 'completed'], 
    default: 'active' 
  },
  sentiment: { type: String },
  resolved: { type: Boolean },
  resolutionSummary: { type: String }
});

const PropertyAnalyticsSchema = new Schema<IPropertyAnalytics>({
  propertyId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  occupancyRate: { type: Number, required: true },
  averageRent: { type: Number, required: true },
  maintenanceCosts: { type: Number, required: true },
  revenue: { type: Number, required: true },
  expenses: { type: Number, required: true },
  netIncome: { type: Number, required: true },
  historicalData: [{
    date: { type: Date, required: true },
    occupancyRate: { type: Number },
    revenue: { type: Number },
    expenses: { type: Number },
    netIncome: { type: Number }
  }],
  predictions: [{
    date: { type: Date, required: true },
    occupancyRate: { type: Number },
    revenue: { type: Number },
    expenses: { type: Number },
    netIncome: { type: Number },
    confidence: { type: Number }
  }],
  marketComparisons: [{
    metric: { type: String, required: true },
    propertyValue: { type: Number, required: true },
    marketAverage: { type: Number, required: true },
    percentDifference: { type: Number, required: true }
  }]
});

// Define schemas for new models
const ListingSchema = new Schema<IListing>({
  propertyId: { type: String, required: true },
  unitId: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  aiGeneratedDescription: { type: String },
  price: { type: Number, required: true },
  priceHistory: [{
    date: { type: Date, required: true },
    price: { type: Number, required: true },
    reason: { type: String }
  }],
  suggestedPrice: { type: Number },
  status: { 
    type: String, 
    enum: ['draft', 'active', 'pending', 'rented', 'inactive'], 
    default: 'draft' 
  },
  features: [{ type: String }],
  amenities: [{ type: String }],
  images: [{
    url: { type: String, required: true },
    caption: { type: String },
    isPrimary: { type: Boolean, default: false },
    isEnhanced: { type: Boolean, default: false },
    originalUrl: { type: String }
  }],
  virtualTour: { type: String },
  floorPlan: { type: String },
  dateAvailable: { type: Date, required: true },
  dateCreated: { type: Date, default: Date.now },
  dateUpdated: { type: Date, default: Date.now },
  externalListings: [{
    platform: { type: String, required: true },
    url: { type: String, required: true },
    status: { type: String, required: true },
    datePublished: { type: Date, required: true },
    externalId: { type: String }
  }],
  views: { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 },
  seoKeywords: [{ type: String }],
  contactInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  showingSchedule: {
    availableDates: [{ type: Date }],
    duration: { type: Number },
    instructions: { type: String }
  }
});

const ApplicationSchema = new Schema<IApplication>({
  applicantId: { type: String, required: true },
  propertyId: { type: String, required: true },
  unitId: { type: String, required: true },
  listingId: { type: String },
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'in-review', 'approved', 'denied', 'withdrawn'], 
    default: 'draft' 
  },
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: String },
  personalInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    ssn: { type: String },
    currentAddress: { type: String, required: true },
    moveInDate: { type: Date, required: true }
  },
  employmentInfo: {
    employer: { type: String, required: true },
    position: { type: String, required: true },
    income: { type: Number, required: true },
    startDate: { type: Date, required: true },
    supervisorName: { type: String },
    supervisorContact: { type: String },
    employmentDocuments: [{ type: String }]
  },
  rentalHistory: [{
    address: { type: String, required: true },
    landlordName: { type: String, required: true },
    landlordContact: { type: String, required: true },
    monthlyRent: { type: Number, required: true },
    moveInDate: { type: Date, required: true },
    moveOutDate: { type: Date },
    reasonForLeaving: { type: String }
  }],
  references: [{
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    contact: { type: String, required: true }
  }],
  creditCheck: {
    score: { type: Number },
    reportUrl: { type: String },
    issueDate: { type: Date }
  },
  backgroundCheck: {
    status: { type: String },
    reportUrl: { type: String },
    issueDate: { type: Date },
    flags: [{ type: String }]
  },
  documents: [{ type: String }],
  notes: [{ type: String }],
  aiRiskAssessment: {
    score: { type: Number },
    factors: [{
      factor: { type: String },
      impact: { type: String },
      weight: { type: Number }
    }],
    recommendation: { type: String },
    confidence: { type: Number }
  }
});

const AIGeneratedContentSchema = new Schema<IAIGeneratedContent>({
  contentId: { type: String, required: true, unique: true },
  contentType: { 
    type: String, 
    enum: ['property-description', 'response-suggestion', 'email', 'sms', 'marketing-copy', 'analysis'], 
    required: true 
  },
  originalPrompt: { type: String, required: true },
  generatedContent: { type: String, required: true },
  relatedEntityId: { type: String },
  relatedEntityType: { 
    type: String, 
    enum: ['property', 'unit', 'maintenance', 'message', 'listing', 'application'] 
  },
  modelName: { type: String, required: true },
  modelVersion: { type: String },
  parameters: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived', 'rejected'], 
    default: 'draft' 
  },
  feedback: [{
    userId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comments: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  revisionHistory: [{
    version: { type: Number, required: true },
    content: { type: String, required: true },
    prompt: { type: String },
    timestamp: { type: Date, default: Date.now },
    revisedBy: { type: String }
  }],
  tags: [{ type: String }],
  usageMetrics: {
    views: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 }
  }
});

// Create models
export const Message = mongoose.model<IMessage>('Message', MessageSchema);
export const MaintenanceRecord = mongoose.model<IMaintenanceRecord>('MaintenanceRecord', MaintenanceRecordSchema);
export const CommunicationTemplate = mongoose.model<ICommunicationTemplate>('CommunicationTemplate', CommunicationTemplateSchema);
export const ChatbotConversation = mongoose.model<IChatbotConversation>('ChatbotConversation', ChatbotConversationSchema);
export const PropertyAnalytics = mongoose.model<IPropertyAnalytics>('PropertyAnalytics', PropertyAnalyticsSchema);

// Create new models
export const Listing = mongoose.model<IListing>('Listing', ListingSchema);
export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
export const AIGeneratedContent = mongoose.model<IAIGeneratedContent>('AIGeneratedContent', AIGeneratedContentSchema);

// Add indexes for performance optimization
ListingSchema.index({ propertyId: 1, status: 1 });
ListingSchema.index({ dateAvailable: 1, price: 1 });
ListingSchema.index({ 'externalListings.platform': 1 });

ApplicationSchema.index({ applicantId: 1, status: 1 });
ApplicationSchema.index({ propertyId: 1, unitId: 1 });
ApplicationSchema.index({ submittedAt: 1 });

AIGeneratedContentSchema.index({ contentType: 1, relatedEntityId: 1 });
AIGeneratedContentSchema.index({ tags: 1 }); 