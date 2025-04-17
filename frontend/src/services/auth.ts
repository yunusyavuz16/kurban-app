import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff';
}

interface LoginResponse {
  token: string;
  user: User;
}

export const auth = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  getUsers: async (): Promise<User[]> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await axios.get(`${API_URL}/auth/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  createUser: async (email: string, password: string, role: 'admin' | 'staff'): Promise<User> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await axios.post(
      `${API_URL}/auth/users`,
      { email, password, role },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    await axios.delete(`${API_URL}/auth/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getToken: () => localStorage.getItem('token'),

  setToken: (token: string) => localStorage.setItem('token', token),

  isAuthenticated: () => !!localStorage.getItem('token')
};

export type { User };