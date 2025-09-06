// PropertyFlow AI Desktop Sidebar Navigation
// Fixed sidebar navigation for desktop breakpoints (1024px+)

import React from 'react';
import { styled } from '@mui/material/styles';
import { 
  Drawer, 
  List, 
  Divider, 
  Box, 
  IconButton, 
  Typography, 
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { tokens } from '../../tokens';
import { useNavigation, NavigationItem } from '../NavigationProvider';
import { NavigationItemComponent } from './NavigationItem';
import { SkipLink, Landmark, useReducedMotion } from '../../accessibility';
import { useState } from 'react';

export interface DesktopSidebarProps {
  className?: string;
}

// Styled components
const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 72;

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})<{ collapsed: boolean }>(({ theme, collapsed }) => ({
  width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
  flexShrink: 0,
  
  '& .MuiDrawer-paper': {
    width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
    boxSizing: 'border-box',
    backgroundColor: 'var(--color-background-paper)',
    borderRight: '1px solid var(--color-border-default)',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflow: 'hidden',
    
    '&:hover': {
      overflow: 'auto',
    },
  },
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
  minHeight: '64px',
  borderBottom: '1px solid var(--color-border-default)',
  position: 'relative',
}));

const SidebarContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 64px)',
  overflow: 'auto',
  
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'var(--color-border-default)',
    borderRadius: '3px',
    
    '&:hover': {
      backgroundColor: 'var(--color-border-hover)',
    },
  },
});

const NavigationSection = styled(Box)({
  padding: `${tokens.spacing.md} 0`,
});

const SectionTitle = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})<{ collapsed: boolean }>(({ collapsed }) => ({
  padding: `0 ${tokens.spacing.lg}`,
  marginBottom: tokens.spacing.sm,
  fontSize: tokens.typography.body.small.fontSize,
  fontWeight: tokens.typography.fontWeight.medium,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  
  ...(collapsed && {
    display: 'none',
  }),
}));

const CollapseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: tokens.spacing.sm,
  top: '50%',
  transform: 'translateY(-50%)',
  padding: tokens.spacing.xs,
  backgroundColor: 'var(--color-background-paper)',
  border: '1px solid var(--color-border-default)',
  
  '&:hover': {
    backgroundColor: 'var(--color-surface-hover)',
  },
  
  '&:focus-visible': {
    outline: '2px solid var(--color-primary-main)',
    outlineOffset: '2px',
  },
}));

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ className }) => {
  const { state, items, toggleSidebar } = useNavigation();
  const prefersReducedMotion = useReducedMotion();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const { sidebarCollapsed } = state;

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

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const renderNavigationItems = (navItems: NavigationItem[]) => {
    return navItems.map(item => (
      <React.Fragment key={item.id}>
        <NavigationItemComponent
          item={item}
          variant="sidebar"
          collapsed={sidebarCollapsed}
        />
        
        {/* Render child items */}
        {item.children && item.children.length > 0 && (
          <>
            {!sidebarCollapsed && (
              <NavigationItemComponent
                item={{
                  ...item,
                  id: `${item.id}-toggle`,
                  label: '',
                  href: '#',
                  icon: expandedSections[item.id] ? ExpandLessIcon : ExpandMoreIcon,
                }}
                variant="sidebar"
                collapsed={false}
                onClick={() => toggleSection(item.id)}
              />
            )}
            
            <Collapse 
              in={expandedSections[item.id] && !sidebarCollapsed} 
              timeout={prefersReducedMotion ? 0 : 200}
            >
              <List component="div" disablePadding sx={{ pl: 2 }}>
                {item.children.map(child => (
                  <NavigationItemComponent
                    key={child.id}
                    item={child}
                    variant="sidebar"
                    collapsed={false}
                  />
                ))}
              </List>
            </Collapse>
          </>
        )}
      </React.Fragment>
    ));
  };

  return (
    <>
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      
      <Landmark role="navigation" aria-label="Main navigation">
        <StyledDrawer
          variant="permanent"
          collapsed={sidebarCollapsed}
          className={className}
          PaperProps={{
            'aria-label': 'Primary navigation sidebar',
          }}
        >
          {/* Sidebar Header */}
          <SidebarHeader>
            {!sidebarCollapsed ? (
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  flexGrow: 1,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: 'var(--color-primary-main)',
                }}
              >
                PropertyFlow AI
              </Typography>
            ) : (
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontSize: '1.5rem',
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: 'var(--color-primary-main)',
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                P
              </Typography>
            )}
            
            <Tooltip 
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              placement="right"
            >
              <CollapseButton 
                onClick={toggleSidebar}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </CollapseButton>
            </Tooltip>
          </SidebarHeader>

          {/* Sidebar Content */}
          <SidebarContent>
            {/* Primary Navigation */}
            <NavigationSection>
              <SectionTitle collapsed={sidebarCollapsed}>
                Main
              </SectionTitle>
              <List component="nav" dense>
                {renderNavigationItems(primaryItems)}
              </List>
            </NavigationSection>

            {secondaryItems.length > 0 && (
              <>
                <Divider sx={{ mx: tokens.spacing.md }} />
                
                <NavigationSection>
                  <SectionTitle collapsed={sidebarCollapsed}>
                    Management
                  </SectionTitle>
                  <List component="nav" dense>
                    {renderNavigationItems(secondaryItems)}
                  </List>
                </NavigationSection>
              </>
            )}

            {adminItems.length > 0 && (
              <>
                <Divider sx={{ mx: tokens.spacing.md }} />
                
                <NavigationSection>
                  <SectionTitle collapsed={sidebarCollapsed}>
                    Administration
                  </SectionTitle>
                  <List component="nav" dense>
                    {renderNavigationItems(adminItems)}
                  </List>
                </NavigationSection>
              </>
            )}
          </SidebarContent>
        </StyledDrawer>
      </Landmark>
    </>
  );
};

export default DesktopSidebar;