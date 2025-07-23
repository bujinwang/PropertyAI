import React, { useState } from 'react';
import {
  Alert,
  AlertTitle,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close,
  ExpandMore,
  ExpandLess,
  Notifications,
  NotificationsActive,
  Info,
  Warning,
  Error,
  CheckCircle,
  AutoAwesome,
  Snooze,
  MoreVert
} from '@mui/icons-material';

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  read: boolean;
  aiGenerated?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

export interface NotificationBannerProps {
  // Banner variant for high-priority insights
  variant?: 'banner' | 'badge' | 'message';
  notification?: NotificationItem;
  
  // Badge variant for low-priority notifications
  count?: number;
  maxCount?: number;
  
  // Message variant for detailed insights
  notifications?: NotificationItem[];
  
  // Common props
  onClose?: (notificationId?: string) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onAction?: (notificationId: string, actionIndex: number) => void;
  autoHideDuration?: number;
  position?: 'top' | 'bottom';
  
  // Enhanced non-intrusive features
  respectUserPreferences?: boolean;
  maxVisibleMessages?: number;
  enableGrouping?: boolean;
  enableSnooze?: boolean;
  snoozeOptions?: number[]; // in minutes
  onSnooze?: (notificationId: string, duration: number) => void;
  
  sx?: object;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  variant = 'banner',
  notification,
  count = 0,
  maxCount = 99,
  notifications = [],
  onClose,
  onMarkAsRead,
  onAction,
  autoHideDuration,
  position = 'top',
  respectUserPreferences = true,
  maxVisibleMessages = 5,
  enableGrouping = false,
  enableSnooze = false,
  snoozeOptions = [5, 15, 30, 60],
  onSnooze,
  sx = {}
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(true);
  const [snoozeMenuAnchor, setSnoozeMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentSnoozeNotificationId, setCurrentSnoozeNotificationId] = useState<string | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle />;
      case 'warning':
        return <Warning />;
      case 'error':
        return <Error />;
      default:
        return <Info />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return theme.palette.error.main;
      case 'high':
        return theme.palette.warning.main;
      case 'medium':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const handleClose = (notificationId?: string) => {
    setOpen(false);
    onClose?.(notificationId);
  };

  const handleMarkAsRead = (notificationId: string) => {
    onMarkAsRead?.(notificationId);
  };

  const handleAction = (notificationId: string, actionIndex: number) => {
    onAction?.(notificationId, actionIndex);
  };

  const handleSnoozeClick = (event: React.MouseEvent<HTMLElement>, notificationId: string) => {
    setSnoozeMenuAnchor(event.currentTarget);
    setCurrentSnoozeNotificationId(notificationId);
  };

  const handleSnoozeSelect = (duration: number) => {
    if (currentSnoozeNotificationId && onSnooze) {
      onSnooze(currentSnoozeNotificationId, duration);
    }
    setSnoozeMenuAnchor(null);
    setCurrentSnoozeNotificationId(null);
  };

  const handleSnoozeMenuClose = () => {
    setSnoozeMenuAnchor(null);
    setCurrentSnoozeNotificationId(null);
  };

  const groupNotificationsByType = (notifications: NotificationItem[]) => {
    if (!enableGrouping) return notifications;
    
    const grouped = notifications.reduce((acc, notification) => {
      const key = `${notification.type}-${notification.priority}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(notification);
      return acc;
    }, {} as Record<string, NotificationItem[]>);

    return Object.values(grouped).map(group => {
      if (group.length === 1) return group[0];
      
      // Create a grouped notification
      return {
        ...group[0],
        id: `group-${group[0].type}-${group[0].priority}`,
        title: `${group.length} ${group[0].type} notifications`,
        message: `${group.length} notifications of type ${group[0].type}`,
        timestamp: new Date(Math.max(...group.map(n => n.timestamp.getTime())))
      };
    });
  };

  const getVisibleNotifications = (notifications: NotificationItem[]) => {
    const processed = enableGrouping ? groupNotificationsByType(notifications) : notifications;
    return processed.slice(0, maxVisibleMessages);
  };

  // Banner variant for high-priority insights
  if (variant === 'banner' && notification) {
    return (
      <>
        <Snackbar
          open={open}
          autoHideDuration={autoHideDuration}
          onClose={() => handleClose(notification.id)}
          anchorOrigin={{ 
            vertical: position, 
            horizontal: 'center' 
          }}
          sx={sx}
        >
          <Alert
            severity={notification.type}
            onClose={() => handleClose(notification.id)}
            sx={{
              minWidth: 400,
              ...(notification.aiGenerated && {
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              })
            }}
            icon={notification.aiGenerated ? (
              <Box display="flex" alignItems="center" gap={0.5}>
                <AutoAwesome sx={{ fontSize: '1rem' }} />
                {getIcon(notification.type)}
              </Box>
            ) : undefined}
            role="alert"
            aria-live="assertive"
          >
            <AlertTitle>
              <Box display="flex" alignItems="center" gap={1}>
                {notification.title}
                <Chip
                  size="small"
                  label={notification.priority}
                  sx={{
                    backgroundColor: getPriorityColor(notification.priority),
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
              </Box>
            </AlertTitle>
            <Typography variant="body2" sx={{ mb: notification.actions || enableSnooze ? 1 : 0 }}>
              {notification.message}
            </Typography>
            {(notification.actions || enableSnooze) && (
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                {notification.actions && (
                  <Box display="flex" gap={1}>
                    {notification.actions.map((action, index) => (
                      <Button
                        key={index}
                        size="small"
                        variant={action.variant || 'outlined'}
                        color={action.color || 'primary'}
                        onClick={() => {
                          action.onClick();
                          handleAction(notification.id, index);
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Box>
                )}
                {enableSnooze && (
                  <IconButton
                    size="small"
                    onClick={(e) => handleSnoozeClick(e, notification.id)}
                    aria-label="Snooze notification"
                  >
                    <Snooze fontSize="small" />
                  </IconButton>
                )}
              </Box>
            )}
          </Alert>
        </Snackbar>
        
        {/* Snooze Menu for Banner */}
        <Menu
          anchorEl={snoozeMenuAnchor}
          open={Boolean(snoozeMenuAnchor)}
          onClose={handleSnoozeMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {snoozeOptions.map((duration) => (
            <MenuItem
              key={duration}
              onClick={() => handleSnoozeSelect(duration)}
            >
              {duration < 60 ? `${duration} minutes` : `${duration / 60} hour${duration > 60 ? 's' : ''}`}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  // Badge variant for low-priority notifications
  if (variant === 'badge') {
    return (
      <Badge
        badgeContent={count > maxCount ? `${maxCount}+` : count}
        color="error"
        sx={sx}
        aria-label={`${count} unread notifications`}
      >
        <IconButton
          color="inherit"
          aria-label="notifications"
          onClick={() => setExpanded(!expanded)}
        >
          {count > 0 ? <NotificationsActive /> : <Notifications />}
        </IconButton>
      </Badge>
    );
  }

  // Message variant for detailed insights
  if (variant === 'message') {
    const processedNotifications = enableGrouping ? groupNotificationsByType(notifications) : notifications;
    const visibleNotifications = expanded ? processedNotifications : processedNotifications.slice(0, maxVisibleMessages);
    const hasMoreNotifications = processedNotifications.length > maxVisibleMessages;
    
    return (
      <Box sx={sx}>
        {visibleNotifications.map((notif) => (
          <Card
            key={notif.id}
            sx={{
              mb: 1,
              ...(notif.aiGenerated && {
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
              }),
              ...(notif.priority === 'critical' && {
                borderLeft: `4px solid ${theme.palette.error.main}`,
              }),
              ...(notif.priority === 'high' && {
                borderLeft: `4px solid ${theme.palette.warning.main}`,
              })
            }}
            role="article"
            aria-labelledby={`notification-title-${notif.id}`}
          >
            <CardContent sx={{ pb: '16px !important' }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {notif.aiGenerated && (
                      <AutoAwesome 
                        sx={{ 
                          color: theme.palette.primary.main,
                          fontSize: '1rem'
                        }}
                        aria-label="AI Generated"
                      />
                    )}
                    {getIcon(notif.type)}
                    <Typography
                      id={`notification-title-${notif.id}`}
                      variant="subtitle2"
                      fontWeight={600}
                      color={notif.read ? 'text.secondary' : 'text.primary'}
                    >
                      {notif.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={notif.priority}
                      sx={{
                        backgroundColor: getPriorityColor(notif.priority),
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 18
                      }}
                    />
                  </Box>
                  
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {notif.message}
                  </Typography>
                  
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ display: 'block', mb: notif.actions ? 1 : 0 }}
                  >
                    {notif.timestamp.toLocaleString()}
                  </Typography>
                  
                  {notif.actions && (
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {notif.actions.map((action, index) => (
                        <Button
                          key={index}
                          size="small"
                          variant={action.variant || 'text'}
                          color={action.color || 'primary'}
                          onClick={() => {
                            action.onClick();
                            handleAction(notif.id, index);
                          }}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </Box>
                  )}
                </Box>
                
                <Box display="flex" flexDirection="column" gap={0.5}>
                  {!notif.read && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => handleMarkAsRead(notif.id)}
                      sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                      Mark as read
                    </Button>
                  )}
                  {enableSnooze && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleSnoozeClick(e, notif.id)}
                      aria-label="Snooze notification"
                    >
                      <Snooze fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleClose(notif.id)}
                    aria-label="Close notification"
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
        
        {hasMoreNotifications && (
          <Card sx={{ mt: 1, textAlign: 'center' }}>
            <CardContent sx={{ py: 1 }}>
              <Button
                size="small"
                variant="text"
                onClick={() => setExpanded(!expanded)}
                startIcon={expanded ? <ExpandLess /> : <ExpandMore />}
              >
                {expanded ? 'Show Less' : `Show ${processedNotifications.length - maxVisibleMessages} More`}
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Snooze Menu */}
        <Menu
          anchorEl={snoozeMenuAnchor}
          open={Boolean(snoozeMenuAnchor)}
          onClose={handleSnoozeMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {snoozeOptions.map((duration) => (
            <MenuItem
              key={duration}
              onClick={() => handleSnoozeSelect(duration)}
            >
              {duration < 60 ? `${duration} minutes` : `${duration / 60} hour${duration > 60 ? 's' : ''}`}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }

  return null;
};

export default NotificationBanner;