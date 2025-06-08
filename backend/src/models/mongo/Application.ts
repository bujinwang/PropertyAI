import { Schema, model, Document } from 'mongoose';

interface IApplication extends Document {
  listingId: string;
  applicantId: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Requires Manual Review';
}

const ApplicationSchema = new Schema<IApplication>(
  {
    listingId: { type: String, required: true },
    applicantId: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Requires Manual Review'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

export const Application = model<IApplication>('Application', ApplicationSchema);
