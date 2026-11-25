import { apiClient } from './apiClient';

export const notificationApi = {
  async getMyNotifications() {
    const res = await apiClient.get('/notifications/my');
    return res.data || [];
  },

  async markRead(id) {
    const res = await apiClient.patch(`/notifications/${encodeURIComponent(id)}/read`);
    return res.data;
  },

  async markAllRead() {
    const res = await apiClient.patch('/notifications/read-all');
    return res.data;
  },

  async broadcastNotice(noticeData) {
    const res = await apiClient.post('/notifications/broadcast', noticeData);
    return res.data;
  }
};
