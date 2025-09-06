// PropertyFlow AI Mobile Bottom Tabs Navigation
// Bottom tab navigation for mobile breakpoints (<768px)

import React from 'react';
import { styled } from '@mui/material/styles';
import { 
  BottomNavigation, 
  BottomNavigationAction,
  Badge,
  Box,
  Typography,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { tokens } from '../../tokens';
import { useNavigation, NavigationItem } from '../NavigationProvider';
import { Landmark, VisuallyHidden } from '../../accessibility';

export interface MobileBottomTabsProps {
  className?: string;
}

// Styled components
const StyledBottomNavigation = styled(BottomNavigation)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.appBar,
  borderTop: '1px solid var(--color-border-default)',
  backgroundColor: 'var(--color-background-paper)',
  boxShadow: `0 -2px 8px ${tokens.shadows.md}`,
  minHeight: '64px',
  paddingBottom: 'env(safe-area-inset-bottom)', // iOS safe area support
}));

const StyledBottomNavigationAction = styled(BottomNavigationAction)(({ theme }) => ({
  color: 'var(--color-text-secondary)',
  minWidth: 'auto',
  padding: `${tokens.spacing.sm} ${tokens.spacing.xs}`,
  
  '& .MuiBottomNavigationAction-label': {
    fontSize: tokens.typography.body.small.fontSize,
    fontWeight: tokens.typography.fontWeight.medium,
    lineHeight: tokens.typography.body.small.lineHeight,
    marginTop: tokens.spacing.xs,
    
    '&.Mui-selected': {
      fontSize: tokens.typography.body.small.fontSize,
    },
  },
  
  '&.Mui-selected': {
    color: 'var(--color-primary-main)',
    
    '& .MuiSvgIcon-root': {
      transform: 'scale(1.1)',
    },
  },
  
  '&:focus-visible': {
    outline: '2px solid var(--color-primary-main)',
    outlineOffset: '2px',
    borderRadius: tokens.borderRadius.sm,
  },
  
  '& .MuiSvgIcon-root': {
    fontSize: '24px',
    transition: 'transform 0.2s ease-in-out',
  },
}));

const TabBadge = styled(Badge)({
  '& .MuiBadge-badge': {
    right: '8px',
    top: '8px',
    backgroundColor: 'var(--color-error-main)',
    color: 'var(--color-error-contrast)',
    fontSize: '0.75rem',
    height: '18px',
    minWidth: '18px',
  },
  
  '& .MuiBadge-dot': {
    right: '12px',
    top: '12px',
    backgroundColor: 'var(--color-primary-main)',
  },
});

const ContentSpacer = styled(Box)({
  height: '64px', // Same as bottom navigation height
  flexShrink: 0,
});

export const MobileBottomTabs: React.FC<MobileBottomTabsProps> = ({ className }) => {
  const { items, state } = useNavigation();
  const location = useLocation();
  const navigate = useNavigate();

  // Get primary navigation items for bottom tabs (max 5 items for optimal UX)
  const primaryItems = items
    .filter(item => 
      ['dashboard', 'properties', 'maintenance', 'communications', 'analytics'].includes(item.id)
    )
    .slice(0, 5); // Ensure maximum 5 tabs

  const currentPath = location.pathname;
  const activeIndex = primaryItems.findIndex(item => 
    currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href))
  );

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const selectedItem = primaryItems[newValue];
    if (selectedItem && !selectedItem.isExternal) {
      navigate(selectedItem.href);
    } else if (selectedItem && selectedItem.isExternal) {
      window.open(selectedItem.href, '_blank', 'noopener,noreferrer');
    }
  };

  const renderTabAction = (item: NavigationItem, index: number) => {
    const isActive = index === activeIndex;
    const notificationCount = state.notifications[item.id];
    
    const tabContent = (
      <item.icon />
    );

    return (
      <StyledBottomNavigationAction
        key={item.id}
        label={item.label}
        value={index}
        icon={
          notificationCount ? (
            <TabBadge 
              badgeContent={notificationCount} 
              color={typeof notificationCount === 'number' && notificationCount > 0 ? 'error' : 'default'}
              variant={typeof notificationCount === 'string' ? 'dot' : 'standard'}
            >
              {tabContent}
            </TabBadge>
          ) : (
            tabContent
          )
        }
        aria-label={`${item.label}${notificationCount ? ` (${notificationCount} notifications)` : ''}`}
        aria-current={isActive ? 'page' : undefined}
      />
    );
  };

  if (primaryItems.length === 0) {
    return <ContentSpacer />;
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed bottom navigation */}
      <ContentSpacer />
      
      <Landmark role="navigation" aria-label="Primary mobile navigation">
        <StyledBottomNavigation
          value={activeIndex >= 0 ? activeIndex : false}
          onChange={handleChange}
          className={className}
          component="nav"
          aria-label="Primary navigation tabs"
        >
          {primaryItems.map(renderTabAction)}
          
          <VisuallyHidden>
            <Typography component="div">
              Mobile bottom tab navigation with {primaryItems.length} primary destinations.
              Currently on: {primaryItems[activeIndex]?.label || 'Unknown page'}
            </Typography>
          </VisuallyHidden>
        </StyledBottomNavigation>
      </Landmark>
    </>
  );
};

export default MobileBottomTabs;