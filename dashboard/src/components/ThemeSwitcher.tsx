// PropertyFlow AI Theme Switcher Component
// Simple component to test theme switching functionality

import React from 'react';
import { 
  IconButton, 
  Tooltip, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Typography
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  BrightnessAuto as SystemIcon,
} from '@mui/icons-material';
import { useThemeMode } from '../contexts/ThemeContext';

const ThemeSwitcher: React.FC = () => {
  const { mode, actualMode, setThemeMode } = useThemeMode();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeMode(newTheme);
    handleClose();
  };

  const getCurrentIcon = () => {
    if (mode === 'system') return <SystemIcon />;
    return actualMode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />;
  };

  const getCurrentTooltip = () => {
    if (mode === 'system') return `Using system theme (${actualMode})`;
    return actualMode === 'dark' ? 'Dark theme' : 'Light theme';
  };

  return (
    <>
      <Tooltip title={getCurrentTooltip()}>
        <IconButton 
          onClick={handleClick}
          color="inherit"
          aria-label="theme switcher"
          aria-controls={open ? 'theme-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          {getCurrentIcon()}
        </IconButton>
      </Tooltip>
      
      <Menu
        id="theme-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'theme-button',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => handleThemeChange('light')}
          selected={mode === 'light'}
        >
          <ListItemIcon>
            <LightModeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2">Light Theme</Typography>
          </ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleThemeChange('dark')}
          selected={mode === 'dark'}
        >
          <ListItemIcon>
            <DarkModeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2">Dark Theme</Typography>
          </ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleThemeChange('system')}
          selected={mode === 'system'}
        >
          <ListItemIcon>
            <SystemIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2">System Theme</Typography>
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ThemeSwitcher;