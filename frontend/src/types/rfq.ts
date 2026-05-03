// src/types/rfq.ts
// src/types/rfq.ts

export interface RFQItem {
  productType: string;
  quantity: number;
  dimensions?: string;
  material?: string;
  description?: string;
}

export interface RFQ {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: RFQItem[];
  description: string;
  expectedDate?: string;
  status: 'pending' | 'engineering' | 'quotation' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
  engineerNotes?: string;
  salesNotes?: string;
  attachments?: string[];
  productionStage?: 'design' | 'materials_prep' | 'machining' | 'assembly' | 'finishing' | 'qc' | 'packaging' | 'delivering' | 'done' | null;
  // Thêm các trường mới
  technicalSpecs?: {
    thickness?: string;
    weight?: number;
    color?: string;
    temperature?: string;
    pressure?: string;
  };
  quotation?: {
    amount?: number;
    currency?: string;
    validUntil?: string;
    approvedBy?: string;
  };
  feedback?: {
    rating: number;
    comment: string;
    createdAt: string;
  };
}

// ... phần còn lại giữ nguyên

export type RFQStatus = RFQ['status'];
export const statusConfig: Record<RFQStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ xử lý', color: 'text-amber-600', bg: 'bg-amber-100' },
  engineering: { label: 'Đang thiết kế', color: 'text-blue-600', bg: 'bg-blue-100' },
  quotation: { label: 'Đang báo giá', color: 'text-purple-400', bg: 'bg-purple-100' },
  approved: { label: 'Đã duyệt', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  rejected: { label: 'Từ chối', color: 'text-red-600', bg: 'bg-red-100' },
  completed: { label: 'Hoàn thành', color: 'text-green-400', bg: 'bg-green-100' }
};



export type ProductionStage = NonNullable<RFQ['productionStage']>;

export const productionStageConfig: Record<ProductionStage, { label: string; id: number }> = {
  design: { label: 'Thiết kế & Kỹ thuật', id: 1 },
  materials_prep: { label: 'Chuẩn bị vật tư', id: 2 },
  machining: { label: 'Cắt & Gia công thô', id: 3 },
  assembly: { label: 'Lắp ráp & Dán keo', id: 4 },
  finishing: { label: 'Hoàn thiện & Đánh bóng', id: 5 },
  qc: { label: 'Kiểm tra chất lượng', id: 6 },
  packaging: { label: 'Đóng gói', id: 7 },
  delivering: { label: 'Đang giao hàng', id: 8 },
  done: { label: 'Hoàn tất', id: 9 }
};