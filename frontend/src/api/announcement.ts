import api from './axios';

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const getAnnouncementsAPI = async () => {
  const { data } = await api.get('/announcements');
  return data as Announcement[];
};

export const createAnnouncementAPI = async (payload: Partial<Announcement>) => {
  const { data } = await api.post('/announcements', payload);
  return data as Announcement;
};

export const updateAnnouncementAPI = async (id: string, payload: Partial<Announcement>) => {
  const { data } = await api.put(`/announcements/${id}`, payload);
  return data as Announcement;
};

export const deleteAnnouncementAPI = async (id: string) => {
  await api.delete(`/announcements/${id}`);
};
