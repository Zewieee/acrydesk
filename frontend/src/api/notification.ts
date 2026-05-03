import api from './axios';

export interface Notification {
  id: string;
  userId: string;
  type: 'new_rfq' | 'quotation_sent' | 'quotation_approved' | 'status_changed' | 'status_change' | 'new_message' | 'announcement';
  title: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export const getNotificationsAPI = async () => {
  const { data } = await api.get('/notifications');
  return {
    notifications: (data.notifications as any[]).map((n: any) => ({ ...n, id: n._id || n.id })) as Notification[],
    unreadCount: data.unreadCount as number,
  };
};

export const markAsReadAPI = async () => {
  await api.patch('/notifications/read');
};

export const createAnnouncementAPI = async (data: { targetUserId?: string; title: string; message: string }) => {
  const response = await api.post('/notifications/announcement', data);
  return response.data;
};
