import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff';
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await api.get('/auth/me');
    return response.data.data;
  },

  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  createUser: async (email: string, password: string, role: 'admin' | 'staff'): Promise<User> => {
    const response = await api.post('/auth/register', { email, password, role });
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/auth/users/${id}`);
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getToken: () => localStorage.getItem('token'),

  setToken: (token: string) => localStorage.setItem('token', token),

  isAuthenticated: () => !!localStorage.getItem('token')
};

export type { User };