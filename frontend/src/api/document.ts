import api from './axios';

export interface AcryDocument {
  id: string;
  name: string;
  url: string;
  type: 'request' | 'message';
  rfqId: string;
  rfqCode: string;
  createdAt: string;
  fileType?: string;
}

export const getDocumentsAPI = async (): Promise<AcryDocument[]> => {
  const response = await api.get<AcryDocument[]>('/documents');
  return response.data;
};
