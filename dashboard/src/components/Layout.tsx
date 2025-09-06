import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Build as BuildIcon,
  Apartment as ApartmentIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  Campaign as CampaignIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Report as ReportIcon,
} from '@mui/icons-material';
import Header from './Header';
import { 
  NavigationProvider, 
  DesktopSidebar, 
  TabletDrawer, 
  MobileBottomTabs,
  useNavigationBreakpoint,
  createNavigationItem,
  type NavigationItem 
} from '../design-system/navigation';
import { Landmark } from '../design-system/accessibility';

// PropertyFlow AI navigation structure based on UX specification
const navigationItems: NavigationItem[] = [
  createNavigationItem({
    id: 'dashboard',
    label: 'Dashboard',
    icon: DashboardIcon,
    href: '/',
    description: 'Overview and key metrics',
  }),
  createNavigationItem({
    id: 'properties',
    label: 'Properties',
    icon: ApartmentIcon,
    href: '/rentals',
    description: 'Property listings and management',
  }),
  createNavigationItem({
    id: 'maintenance',
    label: 'Maintenance',
    icon: BuildIcon,
    href: '/maintenance',
    description: 'Maintenance requests and tracking',
  }),
  createNavigationItem({
    id: 'communications',
    label: 'Communications',
    icon: CampaignIcon,
    href: '/communications',
    description: 'Message center and notifications',
  }),
  createNavigationItem({
    id: 'analytics',
    label: 'AI Insights',
    icon: AnalyticsIcon,
    href: '/ai-insights',
    description: 'Analytics and AI-powered insights',
  }),
  createNavigationItem({
    id: 'analytics-dashboard',
    label: 'Analytics Dashboard',
    icon: AnalyticsIcon,
    href: '/analytics-dashboard',
    description: 'Comprehensive data visualization dashboard',
    role: 'manager',
  }),
  createNavigationItem({
    id: 'tenant-management',
    label: 'Tenant Management',
    icon: PeopleIcon,
    href: '/tenant-screening',
    description: 'Tenant screening and management',
    role: 'manager',
  }),
  createNavigationItem({
    id: 'financial',
    label: 'Financial Reports',
    icon: AccountBalanceIcon,
    href: '/financials',
    description: 'Financial tracking and reporting',
    role: 'manager',
  }),
  createNavigationItem({
    id: 'reports',
    label: 'Reports',
    icon: ReportIcon,
    href: '/reports',
    description: 'Custom reports and analytics',
    role: 'manager',
  }),
  createNavigationItem({
    id: 'forms-showcase',
    label: 'Forms Showcase',
    icon: BuildIcon,
    href: '/forms-showcase',
    description: 'Enhanced form components demo',
    role: 'admin',
  }),
  createNavigationItem({
    id: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    href: '/security-settings',
    description: 'System settings and preferences',
    role: 'admin',
  }),
];

// Internal Layout component that uses navigation hooks
const LayoutContent: React.FC = () => {
  const {
    shouldShowSidebar,
    shouldShowDrawer,
    shouldShowBottomTabs
  } = useNavigationBreakpoint();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Header - always shown */}
      <Header />
      
      {/* Desktop Sidebar */}
      {shouldShowSidebar && <DesktopSidebar />}
      
      {/* Tablet Drawer */}
      {shouldShowDrawer && <TabletDrawer />}
      
      {/* Mobile Bottom Tabs */}
      {shouldShowBottomTabs && <MobileBottomTabs />}
      
      {/* Main Content Area */}
      <Landmark role="main" aria-label="Main content">
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            // Dynamic padding based on navigation type
            paddingLeft: shouldShowSidebar ? '280px' : 0,
            paddingBottom: shouldShowBottomTabs ? '64px' : 0,
            paddingTop: '64px', // Header height
            minHeight: '100vh',
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              py: 3,
              px: { xs: 2, sm: 3 },
              maxWidth: 1200,
              mx: 'auto',
              width: '100%',
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Landmark>
    </Box>
  );
};

// Main Layout component with NavigationProvider
const Layout: React.FC = () => {
  return (
    <NavigationProvider items={navigationItems}>
      <LayoutContent />
    </NavigationProvider>
  );
};

export default Layout;
