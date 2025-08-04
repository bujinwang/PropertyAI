import React, { useState } from 'react';
import { Box, Button, Typography, Grid } from '@mui/material';
import { DashboardCard, StatusIndicator, NotificationBanner, NotificationItem } from './index';

const SharedComponentsDemo: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  const sampleNotification: NotificationItem = {
    id: '1',
    type: 'info',
    title: 'AI Insight Available',
    message: 'New market analysis suggests optimal pricing adjustments for your properties.',
    priority: 'high',
    timestamp: new Date(),
    read: false,
    aiGenerated: true,
    actions: [
      {
        label: 'View Details',
        onClick: () => console.log('View details clicked'),
        variant: 'contained'
      },
      {
        label: 'Dismiss',
        onClick: () => setShowBanner(false),
        variant: 'text'
      }
    ]
  };

  const sampleNotifications: NotificationItem[] = [
    sampleNotification,
    {
      id: '2',
      type: 'warning',
      title: 'Maintenance Alert',
      message: 'HVAC system in Building A requires attention within 48 hours.',
      priority: 'critical',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      read: false,
      aiGenerated: false
    },
    {
      id: '3',
      type: 'success',
      title: 'Rent Collection Complete',
      message: 'All rent payments for this month have been successfully collected.',
      priority: 'low',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      read: true,
      aiGenerated: false
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Shared Dashboard Components Demo
      </Typography>

      <Grid container spacing={3}>
        {/* DashboardCard Examples */}
        <Grid item xs={12} md={6}>
          <DashboardCard
            title="Basic Dashboard Card"
            subtitle="Simple card with content"
          >
            <Typography variant="body2">
              This is a basic dashboard card with some content inside.
            </Typography>
          </DashboardCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <DashboardCard
            title="AI-Generated Insights"
            subtitle="Powered by artificial intelligence"
            aiGenerated={true}
            actions={
              <Button size="small" variant="outlined">
                View All Insights
              </Button>
            }
          >
            <Typography variant="body2" color="primary">
              Based on your property data, we recommend adjusting rent prices 
              by 3-5% to optimize occupancy rates.
            </Typography>
          </DashboardCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <DashboardCard
            title="Loading State Example"
            loading={true}
          >
            <Typography>This content won't show during loading</Typography>
          </DashboardCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <DashboardCard
            title="Error State Example"
            error="Failed to load property data. Please try again."
          >
            <Typography>This content won't show during error</Typography>
          </DashboardCard>
        </Grid>

        {/* StatusIndicator Examples */}
        <Grid item xs={12}>
          <DashboardCard title="Status Indicators">
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" gap={2} alignItems="center">
                <Typography variant="body2" sx={{ minWidth: 100 }}>
                  Chip Variant:
                </Typography>
                <StatusIndicator status="success" label="Operational" />
                <StatusIndicator status="warning" label="Maintenance Due" />
                <StatusIndicator status="error" label="Critical Issue" />
                <StatusIndicator status="info" label="Information" />
              </Box>

              <Box display="flex" gap={2} alignItems="center">
                <Typography variant="body2" sx={{ minWidth: 100 }}>
                  Badge Variant:
                </Typography>
                <StatusIndicator status="success" label="Good" variant="badge" />
                <StatusIndicator status="warning" label="Warning" variant="badge" />
                <StatusIndicator status="critical" label="Critical" variant="badge" />
              </Box>

              <Box display="flex" gap={2} alignItems="center">
                <Typography variant="body2" sx={{ minWidth: 100 }}>
                  Dot Variant:
                </Typography>
                <StatusIndicator status="operational" label="Online" variant="dot" />
                <StatusIndicator status="offline" label="Offline" variant="dot" />
              </Box>
            </Box>
          </DashboardCard>
        </Grid>

        {/* NotificationBanner Examples */}
        <Grid item xs={12}>
          <DashboardCard title="Notification Components">
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Banner Notification
                </Typography>
                <Box display="flex" gap={1}>
                  <Button 
                    variant="outlined" 
                    onClick={() => setShowBanner(true)}
                    disabled={showBanner}
                  >
                    Show Banner Notification
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setShowSnooze(true)}
                    disabled={showSnooze}
                  >
                    Show with Snooze
                  </Button>
                </Box>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Badge Notification
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                  <NotificationBanner
                    variant="badge"
                    count={notificationCount}
                  />
                  <Button 
                    size="small" 
                    onClick={() => setNotificationCount(prev => Math.max(0, prev - 1))}
                  >
                    Decrease Count
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => setNotificationCount(prev => prev + 1)}
                  >
                    Increase Count
                  </Button>
                </Box>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Message Notifications
                </Typography>
                <NotificationBanner
                  variant="message"
                  notifications={sampleNotifications}
                  onMarkAsRead={(id) => console.log('Mark as read:', id)}
                  onClose={(id) => console.log('Close notification:', id)}
                  enableSnooze={true}
                  onSnooze={(id, duration) => console.log('Snooze notification:', id, 'for', duration, 'minutes')}
                  maxVisibleMessages={2}
                  enableGrouping={false}
                />
              </Box>
            </Box>
          </DashboardCard>
        </Grid>
      </Grid>

      {/* Banner notification overlay */}
      {showBanner && (
        <NotificationBanner
          variant="banner"
          notification={sampleNotification}
          onClose={() => setShowBanner(false)}
          autoHideDuration={6000}
        />
      )}
      
      {/* Banner notification with snooze */}
      {showSnooze && (
        <NotificationBanner
          variant="banner"
          notification={sampleNotification}
          onClose={() => setShowSnooze(false)}
          autoHideDuration={6000}
          enableSnooze={true}
          onSnooze={(id, duration) => {
            console.log('Snoozed notification:', id, 'for', duration, 'minutes');
            setShowSnooze(false);
          }}
        />
      )}
    </Box>
  );
};

export default SharedComponentsDemo;