import api from './axios';

export interface Message {
  _id: string;
  requestId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  senderRole: string;
  content: string;
  attachments?: {
    url: string;
    name: string;
    type: string;
  }[];
  createdAt: string;
}

export const getMessagesAPI = async (requestId: string): Promise<Message[]> => {
  const response = await api.get(`/messages/${requestId}`);
  return response.data;
};

export const sendMessageAPI = async (requestId: string, content: string, attachments?: any[]): Promise<Message> => {
  const response = await api.post(`/messages/${requestId}`, { content, attachments });
  return response.data;
};
