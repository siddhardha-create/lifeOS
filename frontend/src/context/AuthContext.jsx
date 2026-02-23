import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lifeos_token');
    const savedUser = localStorage.getItem('lifeos_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('lifeos_token');
          localStorage.removeItem('lifeos_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('lifeos_token', token);
    localStorage.setItem('lifeos_user', JSON.stringify(user));
    setUser(user);
    toast.success(`Welcome back, ${user.name}! 🎉`);
    return user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { token, user } = res.data;
    localStorage.setItem('lifeos_token', token);
    localStorage.setItem('lifeos_user', JSON.stringify(user));
    setUser(user);
    toast.success(`Welcome to LifeOS, ${user.name}! 🚀`);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lifeos_token');
    localStorage.removeItem('lifeos_user');
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback(async (data) => {
    const res = await api.put('/auth/update', data);
    const updatedUser = res.data.user;
    localStorage.setItem('lifeos_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    toast.success('Settings updated!');
    return updatedUser;
  }, []);

  const value = { user, loading, login, register, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
