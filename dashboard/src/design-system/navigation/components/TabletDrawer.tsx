// PropertyFlow AI Tablet Drawer Navigation
// Slide-out drawer navigation for tablet breakpoints (768px-1023px)

import React from 'react';
import { styled } from '@mui/material/styles';
import { 
  Drawer, 
  List, 
  Divider, 
  Box, 
  IconButton, 
  Typography, 
  Backdrop,
} from '@mui/material';
import {
  Close as CloseIcon,
} from '@mui/icons-material';
import { tokens } from '../../tokens';
import { useNavigation, NavigationItem } from '../NavigationProvider';
import { NavigationItemComponent } from './NavigationItem';
import { Landmark, useFocusManagement, useKeyboardNavigation, useReducedMotion } from '../../accessibility';

export interface TabletDrawerProps {
  className?: string;
}

// Styled components
const DRAWER_WIDTH = 320;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    backgroundColor: 'var(--color-background-paper)',
    borderRight: '1px solid var(--color-border-default)',
    boxShadow: tokens.shadows.lg,
  },
}));

const DrawerHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: `${tokens.spacing.lg} ${tokens.spacing.xl}`,
  minHeight: '64px',
  borderBottom: '1px solid var(--color-border-default)',
  backgroundColor: 'var(--color-background-elevated)',
});

const DrawerContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 64px)',
  overflow: 'auto',
});

const NavigationSection = styled(Box)({
  padding: `${tokens.spacing.lg} 0`,
});

const SectionTitle = styled(Typography)({
  padding: `0 ${tokens.spacing.xl}`,
  marginBottom: tokens.spacing.md,
  fontSize: tokens.typography.body.small.fontSize,
  fontWeight: tokens.typography.fontWeight.medium,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
});

const CloseButton = styled(IconButton)({
  marginLeft: 'auto',
  padding: tokens.spacing.sm,
  color: 'var(--color-text-primary)',
  
  '&:hover': {
    backgroundColor: 'var(--color-surface-hover)',
  },
  
  '&:focus-visible': {
    outline: '2px solid var(--color-primary-main)',
    outlineOffset: '2px',
  },
});

const StyledBackdrop = styled(Backdrop)(({ theme }) => ({
  zIndex: theme.zIndex.drawer - 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
}));

export const TabletDrawer: React.FC<TabletDrawerProps> = ({ className }) => {
  const { state, items, closeDrawer } = useNavigation();
  const prefersReducedMotion = useReducedMotion();
  
  const { drawerOpen } = state;

  // Focus management for drawer
  const { containerRef } = useFocusManagement({
    trapFocus: drawerOpen,
    returnFocus: true,
  });

  // Keyboard navigation
  useKeyboardNavigation({
    onEscape: closeDrawer,
    enabled: drawerOpen,
  });

  // Group navigation items by category
  const primaryItems = items.filter(item => 
    ['dashboard', 'properties', 'maintenance', 'communications', 'analytics'].includes(item.id)
  );
  
  const secondaryItems = items.filter(item => 
    ['tenant-management', 'financial', 'reports', 'settings'].includes(item.id)
  );
  
  const adminItems = items.filter(item => 
    item.role === 'admin'
  );

  const handleItemClick = () => {
    // Close drawer when navigation item is clicked
    closeDrawer();
  };

  const renderNavigationItems = (navItems: NavigationItem[]) => {
    return navItems.map(item => (
      <NavigationItemComponent
        key={item.id}
        item={item}
        variant="drawer"
        onClick={handleItemClick}
      />
    ));
  };

  return (
    <Landmark role="navigation" aria-label="Main navigation drawer">
      <StyledDrawer
        anchor="left"
        open={drawerOpen}
        onClose={closeDrawer}
        className={className}
        ModalProps={{
          keepMounted: true, // Better mobile performance
          BackdropComponent: StyledBackdrop,
        }}
        transitionDuration={prefersReducedMotion ? 0 : undefined}
        PaperProps={{
          ref: containerRef,
          'aria-label': 'Primary navigation drawer',
          'aria-modal': 'true',
          role: 'dialog',
        }}
      >
        {/* Drawer Header */}
        <DrawerHeader>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: tokens.typography.fontWeight.semibold,
              color: 'var(--color-primary-main)',
            }}
          >
            PropertyFlow AI
          </Typography>
          
          <CloseButton 
            onClick={closeDrawer}
            aria-label="Close navigation drawer"
          >
            <CloseIcon />
          </CloseButton>
        </DrawerHeader>

        {/* Drawer Content */}
        <DrawerContent>
          {/* Primary Navigation */}
          <NavigationSection>
            <SectionTitle>
              Main Navigation
            </SectionTitle>
            <List component="nav">
              {renderNavigationItems(primaryItems)}
            </List>
          </NavigationSection>

          {secondaryItems.length > 0 && (
            <>
              <Divider sx={{ mx: tokens.spacing.xl }} />
              
              <NavigationSection>
                <SectionTitle>
                  Management
                </SectionTitle>
                <List component="nav">
                  {renderNavigationItems(secondaryItems)}
                </List>
              </NavigationSection>
            </>
          )}

          {adminItems.length > 0 && (
            <>
              <Divider sx={{ mx: tokens.spacing.xl }} />
              
              <NavigationSection>
                <SectionTitle>
                  Administration
                </SectionTitle>
                <List component="nav">
                  {renderNavigationItems(adminItems)}
                </List>
              </NavigationSection>
            </>
          )}

          {/* Footer space */}
          <Box sx={{ flexGrow: 1, minHeight: tokens.spacing.xl }} />
          
          <Divider sx={{ mx: tokens.spacing.xl }} />
          
          <Box sx={{ 
            p: tokens.spacing.xl,
            textAlign: 'center',
            backgroundColor: 'var(--color-surface-default)',
          }}>
            <Typography variant="caption" color="text.secondary">
              PropertyFlow AI Dashboard
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              Tablet Navigation Mode
            </Typography>
          </Box>
        </DrawerContent>
      </StyledDrawer>
    </Landmark>
  );
};

export default TabletDrawer;