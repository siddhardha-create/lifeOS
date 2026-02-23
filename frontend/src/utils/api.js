import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lifeos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lifeos_token');
      localStorage.removeItem('lifeos_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
