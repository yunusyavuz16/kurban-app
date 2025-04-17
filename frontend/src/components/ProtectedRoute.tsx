import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStaff?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireStaff = false
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isStaff } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireStaff && !isStaff) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}