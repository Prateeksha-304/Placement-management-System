import { apiClient } from './apiClient';

export const companyApi = {
  async getCompanies() {
    const res = await apiClient.get('/companies?format=wrapped');
    return res.data || [];
  },

  async createCompany(data) {
    const res = await apiClient.post('/companies', data);
    return res.data;
  },

  async updateCompany(id, data) {
    const res = await apiClient.patch(`/companies/${encodeURIComponent(id)}`, data);
    return res.data;
  },

  async deleteCompany(id) {
    const res = await apiClient.delete(`/companies/${encodeURIComponent(id)}`);
    return res.data;
  }
};
