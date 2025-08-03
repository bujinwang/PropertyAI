import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Typography,
  Collapse,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Campaign as CampaignIcon,
  Build as BuildIcon,
  AccountBalance as AccountBalanceIcon,
  ExpandLess,
  ExpandMore,
  Apartment as ApartmentIcon,
  RealEstateAgent as RealEstateAgentIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import Header from './Header';

const drawerWidth = 280;

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path?: string;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/',
  },
  {
    text: 'Property Management',
    icon: <BusinessIcon />,
    children: [
      {
        text: 'Rental Listings',
        icon: <ApartmentIcon />,
        path: '/rentals',
      },
      {
        text: 'Add New Rental',
        icon: <RealEstateAgentIcon />,
        path: '/rentals/new',
      },
      // Legacy routes (for backward compatibility)
      {
        text: 'Legacy Properties ⚠️',
        icon: <BusinessIcon />,
        path: '/properties',
        deprecated: true,
      },
      {
        text: 'Legacy Units ⚠️',
        icon: <HomeIcon />,
        path: '/units',
        deprecated: true,
      },
    ],
  },
  {
    text: 'Tenant Management',
    icon: <PeopleIcon />,
    children: [
      {
        text: 'Tenant Screening',
        icon: <AssessmentIcon />,
        path: '/tenant-screening',
      },
      {
        text: 'Tenant Ratings',
        icon: <AnalyticsIcon />,
        path: '/tenant-ratings',
      },
      {
        text: 'Tenant Sentiment',
        icon: <AnalyticsIcon />,
        path: '/tenant-sentiment',
      },
    ],
  },
  {
    text: 'AI & Analytics',
    icon: <AnalyticsIcon />,
    children: [
      {
        text: 'AI Insights',
        icon: <AnalyticsIcon />,
        path: '/ai-insights',
      },
      {
        text: 'Risk Assessment',
        icon: <AssessmentIcon />,
        path: '/ai-risk-assessment',
      },
      {
        text: 'Market Intelligence',
        icon: <AnalyticsIcon />,
        path: '/market-intelligence',
      },
      {
        text: 'AI Personalization',
        icon: <AnalyticsIcon />,
        path: '/ai-personalization',
      },
    ],
  },
  {
    text: 'Operations',
    icon: <BuildIcon />,
    children: [
      {
        text: 'Maintenance',
        icon: <BuildIcon />,
        path: '/maintenance',
      },
      {
        text: 'Maintenance Dashboard',
        icon: <DashboardIcon />,
        path: '/maintenance-dashboard',
      },
      {
        text: 'Predictive Maintenance',
        icon: <AnalyticsIcon />,
        path: '/predictive-maintenance',
      },
      {
        text: 'Building Health',
        icon: <BuildIcon />,
        path: '/building-health',
      },
      {
        text: 'Emergency Response',
        icon: <SecurityIcon />,
        path: '/emergency-response',
      },
    ],
  },
  {
    text: 'Financial',
    icon: <AccountBalanceIcon />,
    children: [
      {
        text: 'Financial Overview',
        icon: <AccountBalanceIcon />,
        path: '/financials',
      },
      {
        text: 'Vendor Performance',
        icon: <AnalyticsIcon />,
        path: '/vendor-performance',
      },
      {
        text: 'Vendor Bidding',
        icon: <CampaignIcon />,
        path: '/vendor-bidding',
      },
    ],
  },
  {
    text: 'Communication',
    icon: <CampaignIcon />,
    children: [
      {
        text: 'Communication Hub',
        icon: <CampaignIcon />,
        path: '/communications',
      },
      {
        text: 'AI Communication Training',
        icon: <AnalyticsIcon />,
        path: '/ai-communication-training',
      },
      {
        text: 'Digital Concierge',
        icon: <PeopleIcon />,
        path: '/digital-concierge',
      },
      {
        text: 'Community Engagement',
        icon: <PeopleIcon />,
        path: '/community-engagement',
      },
    ],
  },
  {
    text: 'Marketing',
    icon: <CampaignIcon />,
    path: '/marketing',
  },
  {
    text: 'Settings & Admin',
    icon: <SettingsIcon />,
    children: [
      {
        text: 'Security Settings',
        icon: <SecurityIcon />,
        path: '/security-settings',
      },
      {
        text: 'Access Control',
        icon: <SecurityIcon />,
        path: '/access-control',
      },
      {
        text: 'External Integrations',
        icon: <SettingsIcon />,
        path: '/external-integrations',
      },
      {
        text: 'Document Verification',
        icon: <AssessmentIcon />,
        path: '/document-verification',
      },
    ],
  },
  {
    text: 'Development',
    icon: <SettingsIcon />,
    children: [
      {
        text: 'UX Review',
        icon: <AnalyticsIcon />,
        path: '/ux-review',
      },
      {
        text: 'AI Components Demo',
        icon: <AnalyticsIcon />,
        path: '/ai-components-demo',
      },
      {
        text: 'Document Verification Demo',
        icon: <AssessmentIcon />,
        path: '/document-verification-demo',
      },
    ],
  },
];

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleItemClick = (text: string) => {
    setOpenItems(prev => ({
      ...prev,
      [text]: !prev[text]
    }));
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openItems[item.text];

    if (hasChildren) {
      return (
        <React.Fragment key={item.text}>
          <ListItem disablePadding sx={{ pl: depth * 2 }}>
            <ListItemButton onClick={() => handleItemClick(item.text)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
              {isOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => renderNavigationItem(child, depth + 1))}
            </List>
          </Collapse>
        </React.Fragment>
      );
    }

    return (
      <ListItem key={item.text} disablePadding sx={{ pl: depth * 2 }}>
        <ListItemButton
          component={Link}
          to={item.path!}
          selected={isActive(item.path!)}
          sx={{
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '& .MuiListItemIcon-root': {
                color: 'primary.contrastText',
              },
            },
          }}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItemButton>
      </ListItem>
    );
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          PropertyAI
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map(item => renderNavigationItem(item))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onMenuToggle={handleDrawerToggle} />
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;