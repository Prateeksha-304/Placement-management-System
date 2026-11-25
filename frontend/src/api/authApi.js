import { apiClient } from './apiClient';

export const authApi = {
  async login(email, password, role) {
    const res = await apiClient.post('/auth/login', { email, password, role });
    return res.data; // { token, user: { id, email, role, usn, name } }
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network logout error
    }
  },

  async getMe() {
    const res = await apiClient.get('/auth/me');
    return res.data;
  }
};
