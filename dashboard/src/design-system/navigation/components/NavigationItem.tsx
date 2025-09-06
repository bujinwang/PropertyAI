// PropertyFlow AI Navigation Item Component
// Consistent navigation item component used across all navigation contexts

import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { styled, alpha } from '@mui/material/styles';
import { 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Badge, 
  Tooltip,
  Box,
} from '@mui/material';
import { tokens } from '../../tokens';
import { NavigationItem as NavigationItemType } from '../NavigationProvider';
import { VisuallyHidden } from '../../accessibility';

export interface NavigationItemProps {
  item: NavigationItemType;
  isActive?: boolean;
  variant?: 'sidebar' | 'drawer' | 'bottomTab';
  collapsed?: boolean;
  onClick?: () => void;
  className?: string;
}

// Styled components
const StyledListItem = styled(ListItem, {
  shouldForwardProp: (prop) => !['variant', 'isActive'].includes(prop as string),
})<{ variant: NavigationItemProps['variant']; isActive: boolean }>(({ theme, variant, isActive }) => {
  const baseStyles = {
    padding: 0,
    marginBottom: variant === 'bottomTab' ? 0 : tokens.spacing.xs,
  };

  return baseStyles;
});

const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => !['variant', 'isActive', 'collapsed'].includes(prop as string),
})<{ 
  variant: NavigationItemProps['variant']; 
  isActive: boolean;
  collapsed?: boolean;
}>(({ theme, variant, isActive, collapsed }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'sidebar':
        return {
          minHeight: '48px',
          borderRadius: collapsed ? '50%' : tokens.borderRadius.md,
          padding: collapsed ? tokens.spacing.sm : `${tokens.spacing.sm} ${tokens.spacing.md}`,
          margin: collapsed ? `0 ${tokens.spacing.sm}` : `0 ${tokens.spacing.md}`,
          width: collapsed ? '40px' : 'auto',
          justifyContent: collapsed ? 'center' : 'flex-start',
          
          ...(isActive && {
            backgroundColor: 'var(--color-primary-main)',
            color: 'var(--color-primary-contrast)',
            
            '&:hover': {
              backgroundColor: 'var(--color-primary-dark)',
            },
          }),
          
          ...(!isActive && {
            color: 'var(--color-text-primary)',
            
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              color: 'var(--color-primary-main)',
            },
          }),
        };
        
      case 'drawer':
        return {
          minHeight: '48px',
          borderRadius: tokens.borderRadius.md,
          padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
          margin: `0 ${tokens.spacing.md}`,
          
          ...(isActive && {
            backgroundColor: 'var(--color-primary-main)',
            color: 'var(--color-primary-contrast)',
            
            '&:hover': {
              backgroundColor: 'var(--color-primary-dark)',
            },
          }),
          
          ...(!isActive && {
            color: 'var(--color-text-primary)',
            
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              color: 'var(--color-primary-main)',
            },
          }),
        };
        
      case 'bottomTab':
        return {
          flexDirection: 'column',
          minHeight: '64px',
          padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
          borderRadius: tokens.borderRadius.sm,
          
          ...(isActive && {
            color: 'var(--color-primary-main)',
          }),
          
          ...(!isActive && {
            color: 'var(--color-text-secondary)',
            
            '&:hover': {
              color: 'var(--color-primary-main)',
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
          }),
        };
        
      default:
        return {};
    }
  };

  return {
    transition: 'all 0.2s ease-in-out',
    
    '&:focus-visible': {
      outline: '2px solid var(--color-primary-main)',
      outlineOffset: '2px',
    },
    
    ...getVariantStyles(),
  };
});

const StyledListItemIcon = styled(ListItemIcon, {
  shouldForwardProp: (prop) => !['variant', 'collapsed'].includes(prop as string),
})<{ variant: NavigationItemProps['variant']; collapsed?: boolean }>(({ variant, collapsed }) => ({
  minWidth: variant === 'bottomTab' ? 'auto' : collapsed ? 'auto' : '40px',
  marginRight: variant === 'bottomTab' ? 0 : collapsed ? 0 : tokens.spacing.sm,
  color: 'inherit',
  
  '& svg': {
    fontSize: variant === 'bottomTab' ? '24px' : '20px',
  },
}));

const StyledListItemText = styled(ListItemText, {
  shouldForwardProp: (prop) => !['variant', 'collapsed'].includes(prop as string),
})<{ variant: NavigationItemProps['variant']; collapsed?: boolean }>(({ variant, collapsed }) => ({
  margin: 0,
  
  '& .MuiListItemText-primary': {
    fontSize: variant === 'bottomTab' ? tokens.typography.body.small.fontSize : tokens.typography.body.medium.fontSize,
    fontWeight: variant === 'bottomTab' ? tokens.typography.fontWeight.medium : tokens.typography.fontWeight.regular,
    lineHeight: variant === 'bottomTab' ? tokens.typography.body.small.lineHeight : tokens.typography.body.medium.lineHeight,
    textAlign: variant === 'bottomTab' ? 'center' : 'left',
    marginTop: variant === 'bottomTab' ? tokens.spacing.xs : 0,
  },
  
  ...(collapsed && variant === 'sidebar' && {
    display: 'none',
  }),
}));

export const NavigationItemComponent: React.FC<NavigationItemProps> = ({
  item,
  isActive = false,
  variant = 'sidebar',
  collapsed = false,
  onClick,
  className,
}) => {
  const location = useLocation();
  
  // Determine if this item should be active
  const itemIsActive = isActive || location.pathname === item.href || 
    (item.href !== '/' && location.pathname.startsWith(item.href));

  const handleClick = () => {
    onClick?.();
  };

  const content = (
    <StyledListItemButton
      component={item.isExternal ? 'a' : RouterLink}
      to={!item.isExternal ? item.href : undefined}
      href={item.isExternal ? item.href : undefined}
      target={item.isExternal ? '_blank' : undefined}
      rel={item.isExternal ? 'noopener noreferrer' : undefined}
      variant={variant}
      isActive={itemIsActive}
      collapsed={collapsed}
      onClick={handleClick}
      aria-label={collapsed ? item.label : undefined}
      aria-current={itemIsActive ? 'page' : undefined}
    >
      <StyledListItemIcon variant={variant} collapsed={collapsed}>
        {item.badge ? (
          <Badge 
            badgeContent={item.badge} 
            color={typeof item.badge === 'number' && item.badge > 0 ? 'error' : 'default'}
            variant={typeof item.badge === 'string' ? 'dot' : 'standard'}
          >
            <item.icon />
          </Badge>
        ) : (
          <item.icon />
        )}
      </StyledListItemIcon>
      
      <StyledListItemText 
        primary={item.label}
        variant={variant}
        collapsed={collapsed}
      />
      
      {collapsed && (
        <VisuallyHidden>
          {item.label}
          {item.description && ` - ${item.description}`}
        </VisuallyHidden>
      )}
    </StyledListItemButton>
  );

  // Wrap with tooltip for collapsed sidebar
  if (collapsed && variant === 'sidebar') {
    return (
      <StyledListItem variant={variant} isActive={itemIsActive} className={className}>
        <Tooltip 
          title={
            <Box>
              <Box component="div" fontWeight="medium">{item.label}</Box>
              {item.description && (
                <Box component="div" fontSize="small" mt={0.5}>
                  {item.description}
                </Box>
              )}
            </Box>
          }
          placement="right"
          arrow
        >
          {content}
        </Tooltip>
      </StyledListItem>
    );
  }

  return (
    <StyledListItem variant={variant} isActive={itemIsActive} className={className}>
      {content}
    </StyledListItem>
  );
};

export default NavigationItemComponent;