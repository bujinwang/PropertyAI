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