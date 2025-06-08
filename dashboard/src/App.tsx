import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, Container } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';
import Header from './components/Header';
import { handleOAuthLogin } from './services/oauthService';

// Import pages (to be created)
import ApplicationsList from './pages/ApplicationsList';
import ApplicationDetail from './pages/ApplicationDetail';
import ApplicationForm from './pages/ApplicationForm';
import LoginScreen from './pages/LoginScreen';
import ProtectedRoute from './components/ProtectedRoute';
import UnitListings from './pages/UnitListings';
import UnitDetail from './pages/UnitDetail';
import UnitForm from './pages/UnitForm';
import Marketing from './pages/Marketing';
import CommunicationHub from './pages/CommunicationHub';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE"; // Fallback to placeholder

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {isAuthenticated && <Header onMenuToggle={handleDrawerToggle} />}
        <Container 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            py: 3,
            mt: isAuthenticated ? 8 : 0 // Add margin top if authenticated to account for header
          }}
        >
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/tenant-screening" element={<ApplicationsList />} />
              <Route path="/tenant-screening/applications/:id" element={<ApplicationDetail />} />
              <Route path="/tenant-screening/applications/new" element={<ApplicationForm />} />
              <Route path="/tenant-screening/applications/:id/edit" element={<ApplicationForm />} />
              <Route path="/units" element={<UnitListings />} />
              <Route path="/units/new" element={<UnitForm />} />
              <Route path="/units/:id" element={<UnitDetail />} />
              <Route path="/units/:id/edit" element={<UnitForm />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/communications" element={<CommunicationHub />} />
              {/* Add more routes as needed */}
              <Route path="/" element={
                <div>
                  Home Page
                </div>
              } />
            </Route>
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
