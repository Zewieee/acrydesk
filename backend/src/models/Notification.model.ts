import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'new_rfq' | 'quotation_sent' | 'quotation_approved' | 'status_changed' | 'status_change' | 'new_message' | 'announcement' | 'production_stage';
  title: string;
  message: string;
  relatedId?: mongoose.Types.ObjectId; // RFQ or Quotation ID
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['new_rfq', 'quotation_sent', 'quotation_approved', 'status_changed', 'status_change', 'new_message', 'announcement', 'production_stage'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
