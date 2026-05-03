import api from './axios';

export const loginAPI = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerAPI = async (data: { name: string; email: string; password: string; phone?: string; company?: string }) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const registerStaffAPI = async (data: any) => {
  const { data: responseData } = await api.post('/auth/register-staff', data);
  return responseData;
};

export const getMeAPI = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const refreshTokenAPI = async (token: string) => {
  const response = await api.post('/auth/refresh-token', { token });
  return response.data;
};

export const forgotPasswordAPI = async (email: string, phone: string) => {
  const response = await api.post('/auth/forgot-password', { email, phone });
  return response.data;
};

export const resetPasswordAPI = async (data: { token: string; newPassword: string }) => {
  const response = await api.post('/auth/reset-password', data);
  return response.data;
};

export const logoutAPI = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const changePasswordAPI = async (currentPassword: string, newPassword: string) => {
  const response = await api.post('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};