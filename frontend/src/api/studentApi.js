import { apiClient } from './apiClient';

export const studentApi = {
  async getProfile() {
    const res = await apiClient.get('/students/me');
    return res.data;
  },

  async getEligibleDrives(usn) {
    const res = await apiClient.get(`/students/${encodeURIComponent(usn)}/eligible-drives`);
    return res; // direct response { student, total_core_eligible_drives, drives }
  },

  async getAllStudents() {
    const res = await apiClient.get('/students');
    return res.data || [];
  },

  async getPlacementStatus(usn) {
    const endpoint = usn ? `/students/${encodeURIComponent(usn)}/placement-status` : '/students/me/placement-status';
    const res = await apiClient.get(endpoint);
    return res.data;
  }
};
