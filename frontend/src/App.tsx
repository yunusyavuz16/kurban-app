import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import StaffPanel from './components/StaffPanel';
import AdminPanel from './components/AdminPanel';
import TVDisplay from './components/TVDisplay';
import UserInquiry from './components/UserInquiry';
import Layout from './components/Layout';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/tv" element={<TVDisplay />} />
            <Route path="/inquiry" element={<UserInquiry />} />

            {/* Protected routes */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute requireStaff>
                  <Layout>
                    <StaffPanel />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminPanel />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Redirect root to appropriate page */}
            <Route
              path="/"
              element={
                <Navigate to="/inquiry" replace />
              }
            />

            {/* Catch all route */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600">Sayfa bulunamadı</p>
                  </div>
                </div>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;