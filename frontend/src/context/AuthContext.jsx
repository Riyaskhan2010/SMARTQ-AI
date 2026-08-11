import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, staffAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => { try { return JSON.parse(localStorage.getItem('smartq_user')); } catch { return null; } });
  const [token, setToken]     = useState(() => localStorage.getItem('smartq_token'));
  const [loading, setLoading] = useState(false);
  const [staffInfo, setStaffInfo] = useState(null);
  // staffSetup holds the selected context during the staff setup flow
  // { sector, organization, department, counter } — persisted in sessionStorage
  const [staffSetup, setStaffSetup] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('smartq_staff_setup')); } catch { return null; }
  });

  const saveSession = (u, t, si) => {
    setUser(u); setToken(t); setStaffInfo(si || null);
    localStorage.setItem('smartq_user',  JSON.stringify(u));
    localStorage.setItem('smartq_token', t);
    connectSocket(u.id);
  };

  const clearSession = useCallback(() => {
    setUser(null); setToken(null); setStaffInfo(null); setStaffSetup(null);
    localStorage.removeItem('smartq_user');
    localStorage.removeItem('smartq_token');
    sessionStorage.removeItem('smartq_staff_setup');
    disconnectSocket();
  }, []);

  // Persist staffSetup to sessionStorage
  const saveStaffSetup = (setup) => {
    setStaffSetup(setup);
    if (setup) sessionStorage.setItem('smartq_staff_setup', JSON.stringify(setup));
    else sessionStorage.removeItem('smartq_staff_setup');
  };

  const clearStaffSetup = async () => {
    try { await staffAPI.unassignCounter(); } catch {}
    saveStaffSetup(null);
  };

  // Verify token on mount
  useEffect(() => {
    if (token && !user) {
      authAPI.me().then(({ data }) => {
        setUser(data.user); setStaffInfo(data.staffInfo); connectSocket(data.user.id);
      }).catch(clearSession);
    } else if (token && user) {
      connectSocket(user.id);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      saveSession(data.user, data.token, data.staffInfo);
      // Clear any old staff setup from a previous session
      if (data.user.role === 'STAFF') saveStaffSetup(null);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const { data } = await authAPI.register(payload);
      saveSession(data.user, data.token, null);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => clearSession();

  return (
    <AuthContext.Provider value={{
      user, token, loading, staffInfo, staffSetup,
      login, register, logout,
      saveStaffSetup, clearStaffSetup,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
