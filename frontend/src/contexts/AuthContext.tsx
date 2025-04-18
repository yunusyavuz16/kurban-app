import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/api';
import api from '../services/api';
import { AxiosError } from 'axios';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
}

interface ErrorResponse {
  error: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validateToken = async (token: string) => {
    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      return response.data;
    } catch (err) {
      console.error('Token validation error:', err);
      localStorage.removeItem('token');
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    let isMounted = true;

    const checkAuth = async () => {
      setLoading(true);
      if (token) {
        try {
          const userData = await validateToken(token);
          if (isMounted) {
          }
        } catch (err) {
          if (isMounted) {
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const { token, user: userData } = await auth.login(email, password);
      localStorage.setItem('token', token);
      setUser(userData);
      setLoading(false);
      return userData;
    } catch (err) {
      console.error('Login error:', err);
      localStorage.removeItem('token');
      setUser(null);
      if (err instanceof Error) {
        if ('response' in err && err.response) {
          const axiosError = err as AxiosError<ErrorResponse>;
          if (axiosError.response?.status === 401) {
            setError('Invalid email or password. Please try again.');
          } else if (axiosError.response?.data?.error) {
            setError(axiosError.response.data.error);
          } else {
            setError('An error occurred during login. Please try again.');
          }
        } else {
          setError(err.message || 'An unexpected error occurred. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setLoading(false);
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};