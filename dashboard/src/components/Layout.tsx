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
  Description as DescriptionIcon,
  Warning as WarningIcon,
  Email as EmailIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
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
import OfflineIndicator from './OfflineIndicator';

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
    href: '/properties',
    description: 'Property listings and management',
  }),
  createNavigationItem({
    id: 'tenants',
    label: 'Tenants',
    icon: PeopleIcon,
    href: '/tenants',
    description: 'Tenant management and CRUD',
  }),
  createNavigationItem({
    id: 'leases',
    label: 'Leases',
    icon: DescriptionIcon,
    href: '/leases',
    description: 'Lease management and tracking',
  }),
  createNavigationItem({
    id: 'payments',
    label: 'Payments',
    icon: AccountBalanceIcon,
    href: '/payments',
    description: 'Payment records and processing',
  }),
  createNavigationItem({
    id: 'documents',
    label: 'Documents',
    icon: DescriptionIcon,
    href: '/documents',
    description: 'Document upload and management',
    children: [
      createNavigationItem({
        id: 'documents-list',
        label: 'All Documents',
        icon: DescriptionIcon,
        href: '/documents',
        description: 'View all documents',
      }),
      createNavigationItem({
        id: 'documents-search',
        label: 'Search Documents',
        icon: DescriptionIcon,
        href: '/documents/search',
        description: 'Advanced document search',
      }),
    ],
  }),
  createNavigationItem({
    id: 'maintenance',
    label: 'Maintenance',
    icon: BuildIcon,
    href: '/maintenance',
    description: 'Maintenance requests and tracking',
  }),
  createNavigationItem({
    id: 'maintenance-requests',
    label: 'Maintenance Requests',
    icon: BuildIcon,
    href: '/maintenance-requests',
    description: 'CRUD operations for maintenance requests',
  }),
  createNavigationItem({
    id: 'work-orders',
    label: 'Work Orders',
    icon: BuildIcon,
    href: '/work-orders',
    description: 'Work order scheduling and tracking',
  }),
  createNavigationItem({
    id: 'communications',
    label: 'Communications',
    icon: CampaignIcon,
    href: '/communications',
    description: 'Message center and notifications',
  }),
  createNavigationItem({
    id: 'messages',
    label: 'Messages',
    icon: EmailIcon,
    href: '/messages',
    description: 'Tenant messaging system',
  }),
  createNavigationItem({
    id: 'notifications',
    label: 'Notifications',
    icon: NotificationsIcon,
    href: '/notifications',
    description: 'Notification and announcement management',
    children: [
      createNavigationItem({
        id: 'notifications-list',
        label: 'All Notifications',
        icon: NotificationsIcon,
        href: '/notifications',
        description: 'View all notifications and announcements',
      }),
      createNavigationItem({
        id: 'notifications-compose',
        label: 'Create Announcement',
        icon: NotificationsIcon,
        href: '/notifications/compose',
        description: 'Create new announcement',
      }),
      createNavigationItem({
        id: 'notifications-templates',
        label: 'Templates',
        icon: NotificationsIcon,
        href: '/notifications/templates',
        description: 'Manage notification templates',
      }),
    ],
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
    id: 'overdue-payments',
    label: 'Overdue Payments',
    icon: WarningIcon,
    href: '/overdue-payments',
    description: 'Track and manage overdue rent payments',
    role: 'manager',
  }),
  createNavigationItem({
    id: 'financial-reports',
    label: 'Financial Reports',
    icon: AccountBalanceIcon,
    href: '/financial-reports',
    description: 'Comprehensive financial analysis and reporting',
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
  createNavigationItem({
    id: 'user-management',
    label: 'User Management',
    icon: AdminPanelSettingsIcon,
    href: '/user-management',
    description: 'User and role management',
    role: 'admin',
    children: [
      createNavigationItem({
        id: 'users',
        label: 'Users',
        icon: PeopleIcon,
        href: '/users',
        description: 'Manage system users',
        role: 'admin',
      }),
      createNavigationItem({
        id: 'roles',
        label: 'Roles',
        icon: GroupIcon,
        href: '/roles',
        description: 'Manage user roles and permissions',
        role: 'admin',
      }),
      createNavigationItem({
        id: 'permissions',
        label: 'Permissions',
        icon: SecurityIcon,
        href: '/permissions',
        description: 'View permission matrix',
        role: 'admin',
      }),
    ],
  }),
  createNavigationItem({
    id: 'user-invitations',
    label: 'User Invitations',
    icon: PersonAddIcon,
    href: '/user-invitations',
    description: 'Invite new users to the system',
    role: 'manager',
  }),
  createNavigationItem({
    id: 'mobile-audit',
    label: 'Mobile Audit',
    icon: SettingsIcon,
    href: '/mobile-audit',
    description: 'Mobile compatibility and performance audit',
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
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      flexDirection: 'column'
    }}>
      {/* Header - always shown */}
      <Header />

      {/* Offline Indicator - always shown */}
      <OfflineIndicator />

      {/* Desktop Sidebar */}
      {shouldShowSidebar && <DesktopSidebar />}

      {/* Tablet Drawer */}
      {shouldShowDrawer && <TabletDrawer />}

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
            paddingBottom: shouldShowBottomTabs ? '80px' : 0, // Increased for better mobile nav
            paddingTop: '64px', // Header height
            minHeight: '100vh',
          }}
        >
          <Box
            className="container-mobile"
            sx={{
              flexGrow: 1,
              py: { xs: 2, sm: 3 },
              width: '100%',
              maxWidth: '100%',
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Landmark>

      {/* Enhanced Mobile Bottom Navigation */}
      {shouldShowBottomTabs && (
        <Box
          className="mobile-nav"
          sx={{
            display: { xs: 'flex', md: 'none' },
            justifyContent: 'space-around',
            alignItems: 'center',
            py: 1,
            px: 2,
            backgroundColor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            minHeight: '80px',
          }}
        >
          <MobileBottomTabs />
        </Box>
      )}
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
