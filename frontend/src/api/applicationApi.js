import { apiClient } from './apiClient';

export const applicationApi = {
  async apply(driveId, resume = null) {
    const payload = { drive_id: driveId };
    if (resume) payload.resume = resume;
    const res = await apiClient.post('/applications', payload);
    return res.data;
  },

  async getMyApplications() {
    const res = await apiClient.get('/applications/my');
    return res.data || [];
  },

  async getAllApplications(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/applications?${query}` : '/applications';
    const res = await apiClient.get(endpoint);
    return res.data || [];
  },

  async getApplicationById(appId) {
    const res = await apiClient.get(`/applications/${encodeURIComponent(appId)}`);
    return res.data;
  },

  async updateStatus(appId, status) {
    const res = await apiClient.patch(`/applications/${encodeURIComponent(appId)}/status`, { status });
    return res.data;
  }
};
