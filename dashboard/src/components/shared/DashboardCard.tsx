import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Box,
  Skeleton,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';

export interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string;
  aiGenerated?: boolean;
  subtitle?: string;
  elevation?: number;
  sx?: object;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  children,
  actions,
  loading = false,
  error,
  aiGenerated = false,
  subtitle,
  elevation = 1,
  sx = {}
}) => {
  const theme = useTheme();

  const cardStyles = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    ...(aiGenerated && {
      border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
      backgroundColor: alpha(theme.palette.primary.main, 0.02),
      '&:hover': {
        borderColor: alpha(theme.palette.primary.main, 0.5),
      }
    }),
    ...sx
  };

  const renderHeader = () => (
    <CardHeader
      title={
        <Box display="flex" alignItems="center" gap={1}>
          {aiGenerated && (
            <AutoAwesome 
              sx={{ 
                color: theme.palette.primary.main,
                fontSize: '1.2rem'
              }}
              aria-label="AI Generated Content"
            />
          )}
          <Typography 
            variant="h6" 
            component="h2"
            sx={{ 
              fontWeight: 600,
              ...(aiGenerated && {
                color: theme.palette.primary.main
              })
            }}
          >
            {title}
          </Typography>
        </Box>
      }
      subheader={subtitle && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          {subtitle}
        </Typography>
      )}
      sx={{ pb: 1 }}
    />
  );

  const renderContent = () => {
    if (loading) {
      return (
        <CardContent sx={{ flexGrow: 1 }}>
          <Box>
            <Skeleton variant="text" width="80%" height={24} />
            <Skeleton variant="text" width="60%" height={20} sx={{ mt: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={120} sx={{ mt: 2 }} />
            <Box display="flex" gap={1} mt={2}>
              <Skeleton variant="rectangular" width={80} height={32} />
              <Skeleton variant="rectangular" width={80} height={32} />
            </Box>
          </Box>
        </CardContent>
      );
    }

    if (error) {
      return (
        <CardContent sx={{ flexGrow: 1 }}>
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            role="alert"
            aria-live="polite"
          >
            {error}
          </Alert>
        </CardContent>
      );
    }

    return (
      <CardContent sx={{ flexGrow: 1, pt: 0 }}>
        {children}
      </CardContent>
    );
  };

  const renderActions = () => {
    if (!actions || loading || error) return null;
    
    return (
      <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
        {actions}
      </CardActions>
    );
  };

  return (
    <Card 
      elevation={elevation}
      sx={cardStyles}
      role="region"
      aria-labelledby={`card-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      {renderHeader()}
      {renderContent()}
      {renderActions()}
    </Card>
  );
};

export default DashboardCard;