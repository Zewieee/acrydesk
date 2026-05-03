import api from './axios';
import type { RFQ } from '../types/rfq';

export interface GetRFQsParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetRFQsResponse {
  requests: any[];
  total: number;
  page: number;
  limit: number;
}

// Map dữ liệu backend (_id, timestamps) sang frontend (id)
const mapBackendToRFQ = (data: any): RFQ => {
  let mappedItems = data.items || [];
  
  // Backward compatibility: Convert v1 schema fields to v2 items array
  if ((!mappedItems || mappedItems.length === 0) && data.productType) {
    mappedItems = [{
      productType: data.productType,
      quantity: data.quantity || 1,
      dimensions: data.dimensions,
      material: data.material,
      description: data.description
    }];
  }

  return {
    id: data._id,
    code: data.code || '',
    customerName: data.customerName || '',
    customerPhone: data.customerPhone || '',
    customerEmail: data.customerEmail || '',
    items: mappedItems,
    description: data.description || '',
    expectedDate: data.expectedDate,
    status: data.status || 'pending',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    salesNotes: data.salesNotes,
    engineerNotes: data.engineerNotes,
    attachments: data.attachments || [],
    productionStage: data.productionStage || null,
    quotation: data.quotation,
    feedback: data.feedback
  };
};

export const getRFQsAPI = async (params?: GetRFQsParams): Promise<{ rfqs: RFQ[]; total: number; page: number; limit: number }> => {
  const response = await api.get<GetRFQsResponse>('/requests', { params });
  return {
    rfqs: response.data.requests.map(mapBackendToRFQ),
    total: response.data.total,
    page: response.data.page,
    limit: response.data.limit,
  };
};

export const getRFQByIdAPI = async (id: string): Promise<RFQ> => {
  const response = await api.get(`/requests/${id}`);
  return mapBackendToRFQ(response.data);
};

export const createRFQAPI = async (data: Partial<RFQ>): Promise<RFQ> => {
  const response = await api.post('/requests', data);
  return mapBackendToRFQ(response.data);
};

export const updateRFQAPI = async (id: string, data: Partial<RFQ>): Promise<RFQ> => {
  const response = await api.put(`/requests/${id}`, data);
  return mapBackendToRFQ(response.data);
};

export const updateRFQStatusAPI = async (id: string, status: string): Promise<RFQ> => {
  const response = await api.patch(`/requests/${id}/status`, { status });
  return mapBackendToRFQ(response.data);
};

export const deleteRFQAPI = async (id: string): Promise<void> => {
  await api.delete(`/requests/${id}`);
};

export const submitFeedbackAPI = async (id: string, feedback: { rating: number; comment: string }): Promise<RFQ> => {
  const response = await api.post(`/requests/${id}/feedback`, feedback);
  return mapBackendToRFQ(response.data);
};

export const updateProductionStageAPI = async (id: string, productionStage: string | null): Promise<RFQ> => {
  const response = await api.patch(`/requests/${id}/production-stage`, { productionStage });
  return mapBackendToRFQ(response.data);
};
