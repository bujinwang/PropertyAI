import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Container, CircularProgress } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';
import Header from './components/Header';
import { handleOAuthLogin } from './services/oauthService';
import theme from './design-system/theme';

// Lazy load pages
const ApplicationsList = lazy(() => import('./pages/ApplicationsList'));
const ApplicationDetail = lazy(() => import('./pages/ApplicationDetail'));
const ApplicationForm = lazy(() => import('./pages/ApplicationForm'));
const LoginScreen = lazy(() => import('./pages/LoginScreen'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const UnitListings = lazy(() => import('./pages/UnitListings'));
const UnitDetail = lazy(() => import('./pages/UnitDetail'));
const UnitForm = lazy(() => import('./pages/UnitForm'));
const Marketing = lazy(() => import('./pages/Marketing'));
const CommunicationHub = lazy(() => import('./pages/CommunicationHub'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const FinancialPage = lazy(() => import('./pages/FinancialPage'));
const MaintenanceDashboard = lazy(() => import('./pages/MaintenanceDashboard'));
const PredictiveMaintenanceDashboard = lazy(() => import('./pages/PredictiveMaintenanceDashboard'));
const AIPersonalizationDashboard = lazy(() => import('./pages/AIPersonalizationDashboard'));
const AIRiskAssessmentDashboard = lazy(() => import('./pages/AIRiskAssessmentDashboard'));
const DocumentVerificationStatusScreen = lazy(() => import('./pages/DocumentVerificationStatusScreen'));
const BuildingHealthMonitorScreen = lazy(() => import('./pages/BuildingHealthMonitorScreen'));
const AIInsightsDashboard = lazy(() => import('./pages/AIInsightsDashboard'));
const AICommunicationTrainingScreen = lazy(() => import('./pages/AICommunicationTrainingScreen'));
const MarketIntelligenceScreen = lazy(() => import('./pages/MarketIntelligenceScreen'));
const TenantSentimentDashboard = lazy(() => import('./pages/TenantSentimentDashboard'));
const EmergencyResponseCenterScreen = lazy(() => import('./pages/EmergencyResponseCenterScreen'));
const VendorPerformanceAnalyticsScreen = lazy(() => import('./pages/VendorPerformanceAnalyticsScreen'));
const VendorBiddingPlatformScreen = lazy(() => import('./pages/VendorBiddingPlatformScreen'));
const ExternalSystemsIntegrationDashboard = lazy(() => import('./pages/ExternalSystemsIntegrationDashboard'));
const SecuritySettingsDashboard = lazy(() => import('./pages/SecuritySettingsDashboard'));
const AccessControlManagementScreen = lazy(() => import('./pages/AccessControlManagementScreen'));
const CommunityEngagementPortal = lazy(() => import('./pages/CommunityEngagementPortal'));

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
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>}>
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
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/financials" element={<FinancialPage />} />
                <Route path="/maintenance-dashboard" element={<MaintenanceDashboard />} />
                <Route path="/predictive-maintenance" element={<PredictiveMaintenanceDashboard />} />
                <Route path="/ai-personalization" element={<AIPersonalizationDashboard />} />
                <Route path="/ai-risk-assessment" element={<AIRiskAssessmentDashboard />} />
                <Route path="/document-verification" element={<DocumentVerificationStatusScreen />} />
                <Route path="/building-health" element={<BuildingHealthMonitorScreen />} />
                <Route path="/ai-insights" element={<AIInsightsDashboard />} />
                <Route path="/ai-communication-training" element={<AICommunicationTrainingScreen />} />
                <Route path="/market-intelligence" element={<MarketIntelligenceScreen />} />
                <Route path="/tenant-sentiment" element={<TenantSentimentDashboard />} />
                <Route path="/emergency-response" element={<EmergencyResponseCenterScreen />} />
                <Route path="/vendor-performance" element={<VendorPerformanceAnalyticsScreen />} />
                <Route path="/vendor-bidding" element={<VendorBiddingPlatformScreen />} />
                <Route path="/external-integrations" element={<ExternalSystemsIntegrationDashboard />} />
                <Route path="/security-settings" element={<SecuritySettingsDashboard />} />
                <Route path="/access-control" element={<AccessControlManagementScreen />} />
                <Route path="/community-engagement" element={<CommunityEngagementPortal />} />
                {/* Add more routes as needed */}
                <Route path="/" element={
                  <div>
                    Home Page
                  </div>
                } />
              </Route>
            </Routes>
          </Suspense>
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
