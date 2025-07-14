import React from 'react';
import { Button, SvgIcon } from '@mui/material';

// SVG paths for provider icons
const icons = {
  google: (
    <SvgIcon viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </SvgIcon>
  ),
  facebook: (
    <SvgIcon viewBox="0 0 24 24">
      <path
        d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"
        fill="#1877F2"
      />
    </SvgIcon>
  ),
};

interface OAuthButtonProps {
  provider: 'google' | 'facebook';
  onClick?: () => void;
}

const OAuthButton: React.FC<OAuthButtonProps> = ({ provider, onClick }) => {
  const buttonText = provider === 'google' ? 'Sign in with Google' : 'Sign in with Facebook';
  const buttonColor = provider === 'google' ? '#ffffff' : '#1877F2';
  const textColor = provider === 'google' ? '#757575' : '#ffffff';
  
  return (
    <Button
      variant="contained"
      startIcon={icons[provider]}
      onClick={onClick}
      sx={{
        backgroundColor: buttonColor,
        color: textColor,
        textTransform: 'none',
        boxShadow: provider === 'google' ? '0px 1px 1px rgba(0, 0, 0, 0.24)' : 'none',
        '&:hover': {
          backgroundColor: provider === 'google' ? '#f5f5f5' : '#166fe5',
        },
        border: provider === 'google' ? '1px solid #dadce0' : 'none',
        fontWeight: 500,
        py: 1,
        px: 2,
      }}
    >
      {buttonText}
    </Button>
  );
};

export default OAuthButton;
