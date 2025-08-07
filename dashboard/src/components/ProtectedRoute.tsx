import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box, Alert, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, token, user } = useAuth();
  const location = useLocation();
  
  // Debug logging
  console.log('ProtectedRoute Debug:', {
    isAuthenticated,
    hasToken: !!token,
    hasUser: !!user,
    localStorageToken: !!localStorage.getItem('authToken'),
    localStorageUser: !!localStorage.getItem('user'),
    currentPath: location.pathname
  });

  // Show loading while checking authentication
  if (token === null && localStorage.getItem('authToken')) {
    console.log('ProtectedRoute: Showing loading spinner - token is null but localStorage has authToken');
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading authentication...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: User not authenticated, redirecting to login');
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute: User authenticated, allowing access');
  return <>{children}</>;
};

export default ProtectedRoute;
