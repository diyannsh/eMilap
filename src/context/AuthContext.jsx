import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = async () => {
    try {
      const res = await api.auth.me();
      setUser(res.data);
      const countRes = await api.notifications.unreadCount().catch(() => ({ data: { count: 0 } }));
      setUnreadCount(countRes?.data?.count || 0);
    } catch {
      setUser(null);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    setUser(res.data);
    const countRes = await api.notifications.unreadCount().catch(() => ({ data: { count: 0 } }));
    setUnreadCount(countRes?.data?.count || 0);
    return res.data;
  };

  const register = async (displayName, email, password, communitySlug) => {
    const res = await api.auth.register(displayName, email, password, communitySlug);
    setUser(res.data);
    setUnreadCount(0);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
      setUnreadCount(0);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, unreadCount, login, register, logout, refresh, setUnreadCount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
