import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const auth = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  }
};

interface MeatPieces {
  leg: number;
  arm: number;
  chest: number;
  back: number;
  ground?: number;
}

interface KurbanStatus {
  id: string;
  name: string;
  label: string;
  color_bg: string;
  color_text: string;
  color_border: string;
  display_order: number;
}

interface Animal {
  id: string;
  order_number: number;
  status: KurbanStatus;
  created_at: string;
  updated_at: string;
  weight?: number;
  notes?: string;
  slaughter_time?: string;
  butcher_name?: string;
  package_count?: number;
  meat_pieces?: MeatPieces;
}

// Define interfaces
interface KurbanCreatePayload {}

interface KurbanUpdatePayload {
  status_id?: string;
  weight?: number;
  notes?: string;
  slaughter_time?: string;
  butcher_name?: string;
  package_count?: number;
  meat_pieces?: any;
  order_number?: number;
}

interface KurbanReorderPayload {
  draggedId: string;
  targetId: string;
}

interface StatusPayload {
  name: string;
  label: string;
  color_bg: string;
  color_text: string;
  color_border: string;
  display_order: number;
}

// Kurban APIs
export const kurban = {
  getAll: async () => {
    const response = await api.get('/kurban');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/kurban/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/kurban', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/kurban/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/kurban/${id}`);
    return response.data;
  },
  search: async (orderNumber: string) => {
    const response = await api.get(`/kurban/search?orderNumber=${orderNumber}`);
    return response.data;
  },
  subscribe: async () => {
    const response = await api.get('/kurban/subscribe');
    return response.data;
  },
  reorder: async (updates: { id: string; order_number: number }[]) => {
    const response = await api.post('/kurban/reorder', { updates });
    return response.data;
  }
};

export const status = {
  getAll: async () => {
    const response = await api.get('/status');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/status', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/status/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/status/${id}`);
    return response.data;
  }
};

export const user = {
  getAll: async () => {
    const response = await api.get('/user');
    return response.data;
  },
  getUsers: async () => {
    const response = await api.get('/user');
    return response.data;
  },
  register: async (email: string, password: string, role: 'admin' | 'staff' = 'staff') => {
    const response = await api.post('/user', { email, password, role });
    return response.data;
  },
  deleteUser: async (email: string) => {
    const response = await api.delete(`/user/${email}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/user', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/user/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/user/${id}`);
    return response.data;
  }
};

export type { Animal, MeatPieces, KurbanStatus, KurbanUpdatePayload, StatusPayload, KurbanReorderPayload };

export default api;