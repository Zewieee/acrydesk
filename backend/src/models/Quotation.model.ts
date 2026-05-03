import mongoose, { Schema, Document } from 'mongoose';

export interface IQuotationItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IQuotation extends Document {
  requestId: mongoose.Types.ObjectId;
  items: IQuotationItem[];
  subTotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'sent';
  notes: string;
  createdBy: mongoose.Types.ObjectId;
  approvedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const QuotationItemSchema = new Schema<IQuotationItem>({
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
});

const QuotationSchema = new Schema<IQuotation>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
    items: [QuotationItemSchema],
    subTotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected', 'sent'],
      default: 'draft',
    },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IQuotation>('Quotation', QuotationSchema);