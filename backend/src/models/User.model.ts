import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
  role: 'customer' | 'sales' | 'engineer' | 'manager';
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  refreshToken?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, unique: true, sparse: true },
    company: { type: String },
    role: {
      type: String,
      enum: ['customer', 'sales', 'engineer', 'manager'],
      required: true,
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);