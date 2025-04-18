import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch user data using the token
      const fetchUser = async () => {
        try {
          const response = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
          // Redirect based on role if not already on the correct page
          if (response.data.role === 'admin' && !window.location.pathname.startsWith('/admin')) {
            navigate('/admin');
          } else if (response.data.role === 'staff' && !window.location.pathname.startsWith('/staff')) {
            navigate('/staff');
          }
        } catch (err) {
          console.error('Error fetching user:', err);
          localStorage.removeItem('token');
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { token, user: userData } = await auth.login(email, password);
      setUser(userData);

      // Redirect based on role after successful login
      if (userData.role === 'admin') {
        navigate('/admin');
      } else if (userData.role === 'staff') {
        navigate('/staff');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Invalid email or password. Please try again.');
        } else if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('An error occurred during login. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      throw err;
    }
  };

  const logout = () => {
    auth.logout();
    setUser(null);
    navigate('/login');
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