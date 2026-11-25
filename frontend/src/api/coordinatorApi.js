import { apiClient } from './apiClient';

export const coordinatorApi = {
  async getDashboard() {
    const res = await apiClient.get('/coordinator/dashboard');
    return res.data;
  },

  async getReports() {
    const res = await apiClient.get('/coordinator/reports');
    return res.data;
  },

  async getPlacements() {
    const res = await apiClient.get('/coordinator/placements');
    return res.data || [];
  },

  async updatePlacementPackage(id, packageLpa) {
    const res = await apiClient.patch(`/coordinator/placement-history/${id}`, { package_lpa: packageLpa });
    return res.data;
  },

  async getOfficerDashboard() {
    const res = await apiClient.get('/officer/dashboard');
    return res.data;
  }
};
