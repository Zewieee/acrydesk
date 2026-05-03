import mongoose, { Schema, Document } from 'mongoose';

export interface IRequestItem {
  productType: string;
  quantity: number;
  dimensions?: string;
  material?: string;
  description?: string;
}

export interface IRequest extends Document {
  code: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: IRequestItem[];
  description: string;
  expectedDate: string;
  // Legacy fields for backward compatibility
  productType?: string;
  quantity?: number;
  dimensions?: string;
  material?: string;
  status: 'pending' | 'engineering' | 'quotation' | 'approved' | 'rejected' | 'completed';
  salesNotes: string;
  engineerNotes: string;
  attachments: string[];
  createdBy: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  productionStage?: 'design' | 'materials_prep' | 'machining' | 'assembly' | 'finishing' | 'qc' | 'packaging' | 'delivering' | 'done' | null;
  feedback?: {
    rating: number;
    comment: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema = new Schema<IRequest>(
  {
    code: { type: String, unique: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    customerEmail: { type: String },
    items: [{
      productType: { type: String, required: true },
      quantity: { type: Number, default: 1 },
      dimensions: { type: String },
      material: { type: String },
      description: { type: String },
    }],
    description: { type: String },
    expectedDate: { type: String },
    // Legacy mapping support
    productType: { type: String },
    quantity: { type: Number },
    dimensions: { type: String },
    material: { type: String },
    status: {
      type: String,
      enum: ['pending', 'engineering', 'quotation', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    salesNotes: { type: String },
    engineerNotes: { type: String },
    attachments: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    productionStage: {
      type: String,
      enum: ['design', 'materials_prep', 'machining', 'assembly', 'finishing', 'qc', 'packaging', 'delivering', 'done', null],
      default: null,
    },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      createdAt: { type: Date }
    }
  },
  { timestamps: true }
);

export default mongoose.model<IRequest>('Request', RequestSchema);