import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  requestId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: string; // 'customer', 'sales', 'engineering', 'manager'
  content: string;
  attachments?: {
    url: string;
    name: string;
    type: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: false, // Giờ có thể chỉ gửi file mà không cần chữ
      trim: true,
      default: '',
    },
    attachments: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model<IMessage>('Message', messageSchema);
export default Message;
