import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
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
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Build as BuildIcon,
  Apartment as ApartmentIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  Campaign as CampaignIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import Header from './Header';

const drawerWidth = 280;

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
}

// Simplified navigation based on the UI/UX Specification sitemap
const navigationItems: NavigationItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'AI Insights', icon: <AnalyticsIcon />, path: '/ai-insights' },
  { text: 'Maintenance', icon: <BuildIcon />, path: '/maintenance' },
  { text: 'Property Listings', icon: <ApartmentIcon />, path: '/rentals' },
  { text: 'Tenant Management', icon: <PeopleIcon />, path: '/tenant-screening' },
  { text: 'Financials', icon: <AccountBalanceIcon />, path: '/financials' },
  { text: 'Communication Hub', icon: <CampaignIcon />, path: '/communications' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/security-settings' },
];

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path: string) => {
    // Special case for dashboard, otherwise check for path equality
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
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
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isActive(item.path)}
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
        ))}
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
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: (theme) => `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: (theme) => `1px solid ${theme.palette.divider}`,
            },
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
          py: 3,
          px: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
