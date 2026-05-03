import api from './axios';

export interface QuotationItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Quotation {
  id: string;
  requestId: any;
  items: QuotationItem[];
  subTotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'sent';
  notes: string;
  createdBy: any;
  approvedBy: any;
  createdAt: string;
  updatedAt: string;
}

const mapQuotation = (q: any): Quotation => ({
  ...q,
  id: q._id || q.id,
});

export const getQuotationsAPI = async (params?: { requestId?: string; status?: string }) => {
  const { data } = await api.get('/quotations', { params });
  return (data as any[]).map(mapQuotation);
};

export const getQuotationByIdAPI = async (id: string) => {
  const { data } = await api.get(`/quotations/${id}`);
  return mapQuotation(data);
};

export const createQuotationAPI = async (payload: {
  requestId: string;
  items: Omit<QuotationItem, 'totalPrice'>[];
  tax?: number;
  discount?: number;
  notes?: string;
}) => {
  const { data } = await api.post('/quotations', payload);
  return mapQuotation(data);
};

export const updateQuotationAPI = async (id: string, payload: any) => {
  const { data } = await api.put(`/quotations/${id}`, payload);
  return mapQuotation(data);
};

export const sendQuotationAPI = async (id: string) => {
  const { data } = await api.patch(`/quotations/${id}/send`);
  return mapQuotation(data);
};

export const deleteQuotationAPI = async (id: string) => {
  await api.delete(`/quotations/${id}`);
};

export const acceptQuotationAPI = async (id: string) => {
  const { data } = await api.patch(`/quotations/${id}/accept`);
  return mapQuotation(data);
};

export const rejectQuotationAPI = async (id: string) => {
  const { data } = await api.patch(`/quotations/${id}/reject`);
  return mapQuotation(data);
};
