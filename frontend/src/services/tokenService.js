const TOKEN_KEY = 'pms_auth_token';
const USER_KEY = 'pms_user_profile';

export const tokenService = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  setToken(token, persist = true) {
    if (persist) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  },

  getUser() {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setUser(user, persist = true) {
    const str = JSON.stringify(user);
    if (persist) {
      localStorage.setItem(USER_KEY, str);
    } else {
      sessionStorage.setItem(USER_KEY, str);
    }
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    // Also clear old mock keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('pms_') && key !== 'pms_remembered_email' && key !== 'pms_theme') {
        localStorage.removeItem(key);
      }
    });
  }
};
