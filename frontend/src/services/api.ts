import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

// Auth APIs
export const auth = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  register: async (email: string, password: string, role: 'admin' | 'staff' = 'staff') => {
    const response = await api.post('/auth/register', { email, password, role });
    return response.data;
  },
  getUsers: async () => {
    const response = await api.get('/auth/users');
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

interface Animal {
  id: string;
  order_number: number;
  status: string;
  created_at: string;
  updated_at: string;
  weight?: number;
  notes?: string;
  slaughter_time?: string;
  butcher_name?: string;
  package_count?: number;
  meat_pieces?: MeatPieces;
}

// Kurban APIs
export const kurban = {
  getAll: async (): Promise<Animal[]> => {
    const response = await api.get('/kurban');
    return response.data;
  },
  getById: async (id: string): Promise<Animal> => {
    const response = await api.get(`/kurban/${id}`);
    return response.data;
  },
  searchByOrderNumber: async (orderNumber: number): Promise<Animal> => {
    const response = await api.get(`/kurban/search/order/${orderNumber}`);
    return response.data;
  },
  create: async (data: { order_number: number }): Promise<Animal> => {
    const response = await api.post('/kurban', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Animal>): Promise<Animal> => {
    const response = await api.put(`/kurban/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/kurban/${id}`);
    return response.data;
  },
  subscribe: (onUpdate: (data: any) => void) => {
    const eventSource = new EventSource(`${API_URL}/kurban/subscribe`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onUpdate(data);
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }
};

export type { Animal, MeatPieces };

export default api;