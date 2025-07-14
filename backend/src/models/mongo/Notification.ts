import { Schema, model, Document } from 'mongoose';

interface INotification extends Document {
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedId: { type: String },
    relatedType: { type: String },
  },
  { timestamps: true }
);

export const Notification = model<INotification>(
  'Notification',
  NotificationSchema
);
