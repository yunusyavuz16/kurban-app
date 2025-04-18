import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import AdminPanel from './components/AdminPanel';
import StaffPanel from './components/StaffPanel';
import TVDisplay from './components/TVDisplay';
import Layout from './components/Layout';

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole: 'admin' | 'staff' }> = ({
  children,
  requiredRole
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    console.log('no user ', user)
    // Kullanıcı giriş yapmamışsa login'e yönlendir, state ile geldiği yeri sakla
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== requiredRole) {
    // Kullanıcı giriş yapmış ama rolü uyuşmuyorsa, kendi rolüne uygun sayfaya yönlendir.
    if (user.role === 'admin') {
       return <Navigate to="/admin" replace />;
    } else if (user.role === 'staff') {
        return <Navigate to="/staff" replace />;
    } else {
        // Beklenmedik bir rol durumu varsa login'e gönder (veya bir hata sayfasına)
        return <Navigate to="/login" replace />;
    }
  }

  // Yetkili kullanıcı ise içeriği göster
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="min-h-screen bg-gray-100">
            <Routes>
              <Route path="/login" element={<Login />} />
              {/* TV Rotası Public */}
              <Route path="/tv" element={<TVDisplay />} />

              {/* Staff Rotası */}
              <Route
                path="/staff"
                element={
                  <ProtectedRoute requiredRole='staff'>
                    <Layout>
                      <StaffPanel />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* Admin Rotası */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole='admin'>
                    <Layout>
                      <AdminPanel />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* Varsayılan Rota - Giriş yapmış kullanıcıyı rolüne göre yönlendir */}
              <Route
                path="/"
                element={ <NavigateToRole /> }
              />
               {/* Yakalanamayan diğer tüm rotalar için login'e yönlendir */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

// Giriş yapmış kullanıcıyı rolüne göre yönlendiren yardımcı bileşen
const NavigateToRole = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  } else if (user.role === 'staff') {
    return <Navigate to="/staff" replace />;
  } else {
    // Geçersiz rol durumunda login'e geri dön
    return <Navigate to="/login" replace />;
  }
};

export default App;