import { apiClient } from './apiClient';

export const driveApi = {
  async getDrives() {
    const res = await apiClient.get('/drives?format=wrapped');
    return res.data || [];
  },

  async createDrive(data) {
    const res = await apiClient.post('/drives', data);
    return res.data;
  },

  async updateDrive(id, data) {
    const res = await apiClient.patch(`/drives/${encodeURIComponent(id)}`, data);
    return res.data;
  },

  async deleteDrive(id) {
    const res = await apiClient.delete(`/drives/${encodeURIComponent(id)}`);
    return res.data;
  }
};
