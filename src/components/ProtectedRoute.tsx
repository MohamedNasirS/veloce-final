  import React from 'react';
  import { Navigate } from 'react-router-dom';
  import { useAuth } from '../contexts/AuthContext';

  interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
  }

  const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user } = useAuth();

    // Add debugging
    console.log('ProtectedRoute - Current user:', user);
    console.log('ProtectedRoute - Allowed roles:', allowedRoles);
    console.log('ProtectedRoute - User role:', user?.role);

    if (!user) {
      console.log('ProtectedRoute - No user found, redirecting to login');
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      console.log('ProtectedRoute - User role not allowed, redirecting to home');
      return <Navigate to="/" replace />;
    }

    console.log('ProtectedRoute - Access granted');
    return <>{children}</>;
  };

  export default ProtectedRoute;
