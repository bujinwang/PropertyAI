import React, { Suspense, useEffect, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { trackPageView, addBreadcrumb } from './utils/analytics';
import Layout from './components/Layout';
import './App.css';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PropertyListings = lazy(() => import('./pages/PropertyListings'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const PropertyForm = lazy(() => import('./pages/PropertyForm'));
const TenantScreening = lazy(() => import('./pages/TenantScreening'));
const ApplicationDetail = lazy(() => import('./pages/ApplicationDetail'));
const ApplicationForm = lazy(() => import('./pages/ApplicationForm'));
const UnitListings = lazy(() => import('./pages/UnitListings'));
const UnitDetail = lazy(() => import('./pages/UnitDetail'));
const UnitForm = lazy(() => import('./pages/UnitForm'));
// NEW: Rental components
const RentalListings = lazy(() => import('./pages/RentalListings'));
const RentalDetail = lazy(() => import('./pages/RentalDetail'));
const RentalForm = lazy(() => import('./pages/RentalForm'));
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
const DigitalConciergeScreen = lazy(() => import('./pages/DigitalConciergeScreen'));
const AIComponentsDemo = lazy(() => import('./pages/AIComponentsDemo'));
const DocumentVerificationDemo = lazy(() => import('./pages/DocumentVerificationDemo'));
const TenantRatingPage = lazy(() => import('./pages/TenantRatingPage'));
const UXReviewDashboard = lazy(() => import('./pages/UXReviewDashboard'));

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";

// Component to track page views
function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
    addBreadcrumb(`Navigated to ${location.pathname}`, 'navigation', 'info');
  }, [location]);

  return null;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Router>
        <PageTracker />
        <div className="App">
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                
                {/* NEW: Rental Management Routes (Unified Model) */}
                <Route path="rentals" element={<RentalListings />} />
                <Route path="rentals/new" element={<RentalForm />} />
                <Route path="rentals/:id" element={<RentalDetail />} />
                <Route path="rentals/:id/edit" element={<RentalForm />} />
                
                {/* LEGACY: Property Management Routes (Keep for backward compatibility) */}
                <Route path="properties" element={<PropertyListings />} />
                <Route path="properties/new" element={<PropertyForm />} />
                <Route path="properties/:id" element={<PropertyDetail />} />
                <Route path="properties/:id/edit" element={<PropertyForm />} />
                
                {/* LEGACY: Unit Management Routes (Keep for backward compatibility) */}
                <Route path="units" element={<UnitListings />} />
                <Route path="units/new" element={<UnitForm />} />
                <Route path="units/:id" element={<UnitDetail />} />
                <Route path="units/:id/edit" element={<UnitForm />} />
                
                {/* Tenant Screening Routes */}
                <Route path="tenant-screening" element={<TenantScreening />} />
                <Route path="tenant-screening/applications/:id" element={<ApplicationDetail />} />
                <Route path="tenant-screening/applications/new" element={<ApplicationForm />} />
                <Route path="tenant-screening/applications/:id/edit" element={<ApplicationForm />} />
                
                {/* Other Routes */}
                <Route path="marketing" element={<Marketing />} />
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
                <Route path="ai-components-demo" element={<AIComponentsDemo />} />
                <Route path="document-verification-demo" element={<DocumentVerificationDemo />} />
                <Route path="tenant-ratings" element={<TenantRatingPage />} />
                <Route path="ux-review" element={<UXReviewDashboard />} />
              </Route>
            </Routes>
          </Suspense>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
