import api from './axios';

export interface Staff {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  company?: string;
  createdAt: string;
}

export const getStaffAllAPI = async (): Promise<Staff[]> => {
  const response = await api.get('/users/staff');
  return response.data;
};

export const getAllUsersAPI = async (): Promise<Staff[]> => {
  const response = await api.get('/users');
  return response.data;
};

export const updateMyProfileAPI = async (data: { name: string; phone: string; avatar?: string }) => {
  const response = await api.put('/users/me', data);
  return response.data;
};
