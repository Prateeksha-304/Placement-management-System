import React, { createContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { tokenService } from '../services/tokenService';

export const AuthContext = createContext();

// Map backend canonical roles to frontend router roles
function normalizeUser(rawUser) {
  if (!rawUser) return null;
  let role = rawUser.role;
  if (role === 'placement_officer') role = 'officer';
  if (role === 'placement_coordinator') role = 'coordinator';

  return {
    id: rawUser.id || rawUser.email,
    email: rawUser.email,
    role,
    backendRole: rawUser.role,
    usn: rawUser.usn || null,
    name: rawUser.name || rawUser.email?.split('@')[0] || 'User',
    isActive: true,
    studentDetails: rawUser.studentDetails || null
  };
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const cached = tokenService.getUser();
    return normalizeUser(cached);
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      const token = tokenService.getToken();
      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      try {
        const me = await authApi.getMe();
        const normalized = normalizeUser({
          id: me.id,
          email: me.email,
          role: me.role,
          usn: me.usn,
          studentDetails: me.studentDetails,
          name: me.studentDetails ? `${me.studentDetails.fname || ''} ${me.studentDetails.lname || ''}`.trim() : (me.role === 'placement_officer' ? 'Placement Officer' : 'Placement Coordinator')
        });
        setCurrentUser(normalized);
        tokenService.setUser(normalized);
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        tokenService.clear();
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = async (email, password, role) => {
    // Call real backend authentication API
    const authData = await authApi.login(email, password, role);
    const normalized = normalizeUser(authData.user);
    tokenService.setToken(authData.token);
    tokenService.setUser(normalized);
    setCurrentUser(normalized);
    return normalized;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      tokenService.clear();
      setCurrentUser(null);
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser,
    loading
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-gray-50 text-sm font-medium text-gray-500">
        Loading placement workspace…
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
