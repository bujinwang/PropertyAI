import React, { Suspense, useEffect, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trackPageView } from './utils/analytics';
import { addBreadcrumb } from './utils/monitoring';
import { AuthProvider } from './contexts/AuthContext';
import { AppErrorBoundary } from './components/error-boundary/AppErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import theme from './design-system/theme';
import './App.css';

// Create a client
const queryClient = new QueryClient();

// Import components - temporarily non-lazy for debugging
import Dashboard from './pages/Dashboard';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
const TenantScreening = lazy(() => import('./pages/TenantScreening'));
const ApplicationDetail = lazy(() => import('./pages/ApplicationDetail'));
const ApplicationForm = lazy(() => import('./pages/ApplicationForm'));
// Rental components
const RentalListings = lazy(() => import('./pages/RentalListings'));
const RentalDetail = lazy(() => import('./pages/RentalDetail'));
const RentalForm = lazy(() => import('./pages/RentalForm'));
const Marketing = lazy(() => import('./pages/Marketing'));
const MarketingCampaigns = lazy(() => import('./pages/marketing/MarketingCampaigns'));
const MarketingAnalytics = lazy(() => import('./pages/marketing/MarketingAnalytics'));
const MarketingPromotions = lazy(() => import('./pages/marketing/MarketingPromotions'));
const MarketingSyndication = lazy(() => import('./pages/marketing/MarketingSyndication'));
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
const DigitalConciergeScreen = lazy(() => import('./pages/DigitalConciergeScreen'));
const DocumentVerificationDemo = lazy(() => import('./pages/DocumentVerificationStatusScreen'));
const TenantRatingPage = lazy(() => import('./pages/TenantRatingPage'));
const UXReviewDashboard = lazy(() => import('./pages/UXReviewDashboard'));

// Component to track page views
function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
    addBreadcrumb(`Navigated to ${location.pathname}`, 'navigation', 'info');
  }, [location]);

  return null;
}

// Wrapper component for lazy-loaded routes
function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {children}
    </Suspense>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={(import.meta as any).env.VITE_GOOGLE_CLIENT_ID || "demo-client-id"}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppErrorBoundary>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <Router>
                <PageTracker />
                <div className="App">
                <AppErrorBoundary fallback={
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h2>Unable to load the application routes</h2>
                    <p>Please refresh the page or contact support if the issue persists.</p>
                    <button onClick={() => window.location.reload()}>Refresh Page</button>
                  </div>
                }>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/login" element={<LoginScreen />} />
                      <Route path="/register" element={<RegisterScreen />} />
                      
                      {/* Protected routes */}
                      <Route path="/" element={
                        <ProtectedRoute>
                          <Layout />
                        </ProtectedRoute>
                      }>
                        <Route index element={<Dashboard />} />
                        
                        {/* Rental Management Routes */}
                        <Route path="rentals" element={
                          <Suspense fallback={<div>Loading...</div>}>
                            <RentalListings />
                          </Suspense>
                        } />
                        <Route path="rentals/new" element={
                          <Suspense fallback={<div>Loading...</div>}>
                            <RentalForm />
                          </Suspense>
                        } />
                        <Route path="rentals/:id" element={
                          <Suspense fallback={<div>Loading...</div>}>
                            <RentalDetail />
                          </Suspense>
                        } />
                        <Route path="rentals/:id/edit" element={
                          <Suspense fallback={<div>Loading...</div>}>
                            <RentalForm />
                          </Suspense>
                        } />
                        
                        {/* Tenant Screening Routes */}
                        <Route path="tenant-screening" element={<TenantScreening />} />
                        <Route path="tenant-screening/applications/:id" element={<ApplicationDetail />} />
                        <Route path="tenant-screening/applications/new" element={<ApplicationForm />} />
                        <Route path="tenant-screening/applications/:id/edit" element={<ApplicationForm />} />
                        
                        {/* Marketing Routes */}
                        <Route path="marketing" element={<Marketing />} />
                        <Route path="marketing/campaigns" element={
                          <Suspense fallback={<div>Loading...</div>}>
                            <MarketingCampaigns />
                          </Suspense>
                        } />
                        <Route path="marketing/analytics" element={
                          <Suspense fallback={<div>Loading...</div>}>
                            <MarketingAnalytics />
                          </Suspense>
                        } />
                        <Route path="marketing/promotions" element={
                          <Suspense fallback={<div>Loading...</div>}>
                            <MarketingPromotions />
                          </Suspense>
                        } />
                        <Route path="marketing/syndication" element={
                          <Suspense fallback={<div>Loading...</div>}>
                            <MarketingSyndication />
                          </Suspense>
                        } />
                        
                        {/* Other Routes */}
                        <Route path="communications" element={<CommunicationHub />} />
                        <Route path="maintenance" element={<MaintenancePage />} />
                        <Route path="financials" element={<FinancialPage />} />
                        <Route path="maintenance-dashboard" element={<MaintenanceDashboard />} />
                        <Route path="predictive-maintenance" element={<PredictiveMaintenanceDashboard />} />
                        <Route path="ai-personalization" element={<AIPersonalizationDashboard />} />
                        <Route path="ai-risk-assessment" element={<AIRiskAssessmentDashboard />} />
                        <Route path="document-verification" element={<DocumentVerificationStatusScreen />} />
                        <Route path="building-health" element={<BuildingHealthMonitorScreen />} />
                        <Route path="ai-insights" element={<AIInsightsDashboard />} />
                        <Route path="ai-communication-training" element={<AICommunicationTrainingScreen />} />
                        <Route path="market-intelligence" element={<MarketIntelligenceScreen />} />
                        <Route path="tenant-sentiment" element={<TenantSentimentDashboard />} />
                        <Route path="emergency-response" element={<EmergencyResponseCenterScreen />} />
                        <Route path="vendor-performance" element={<VendorPerformanceAnalyticsScreen />} />
                        <Route path="vendor-bidding" element={<VendorBiddingPlatformScreen />} />
                        <Route path="external-integrations" element={<ExternalSystemsIntegrationDashboard />} />
                        <Route path="security-settings" element={<SecuritySettingsDashboard />} />
                        <Route path="access-control" element={<AccessControlManagementScreen />} />
                        <Route path="community-engagement" element={<CommunityEngagementPortal />} />
                        <Route path="digital-concierge" element={<DigitalConciergeScreen />} />
                        <Route path="ai-components-demo" element={<AIPersonalizationDashboard />} />
                        <Route path="document-verification-demo" element={<DocumentVerificationDemo />} />
                        <Route path="tenant-ratings" element={<TenantRatingPage />} />
                        <Route path="ux-review" element={<UXReviewDashboard />} />
                      </Route>
                      
                      {/* Catch-all route for unmatched paths */}
                      <Route path="*" element={
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                          <h2>Page Not Found</h2>
                          <p>The requested page could not be found.</p>
                          <button onClick={() => window.location.href = '/'}>Go to Dashboard</button>
                        </div>
                      } />
                    </Routes>
                </AppErrorBoundary>
                </div>
              </Router>
            </QueryClientProvider>
          </AuthProvider>
        </AppErrorBoundary>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
