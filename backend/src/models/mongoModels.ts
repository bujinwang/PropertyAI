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
  maintenanceRequestId: string;
  description: string;
  notes: string[];
  images: string[];
  timestamp: Date;
  createdBy: string;
  status: string;
  costs: {
    description: string;
    amount: number;
    date: Date;
  }[];
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
  description: { type: String, required: true },
  notes: [{ type: String }],
  images: [{ type: String }],
  timestamp: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  costs: [{
    description: { type: String },
    amount: { type: Number },
    date: { type: Date }
  }]
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

// Create models
export const Message = mongoose.model<IMessage>('Message', MessageSchema);
export const MaintenanceRecord = mongoose.model<IMaintenanceRecord>('MaintenanceRecord', MaintenanceRecordSchema);
export const CommunicationTemplate = mongoose.model<ICommunicationTemplate>('CommunicationTemplate', CommunicationTemplateSchema);
export const ChatbotConversation = mongoose.model<IChatbotConversation>('ChatbotConversation', ChatbotConversationSchema);
export const PropertyAnalytics = mongoose.model<IPropertyAnalytics>('PropertyAnalytics', PropertyAnalyticsSchema); 