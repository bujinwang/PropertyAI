import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Pagination,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { dashboardService, Notification, NotificationFilters } from '../services/dashboardService';

const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getNotifications(page, limit, filters);
      setNotifications(response.data);
      setTotal(response.total);
    } catch (err) {
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, filters]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: event.target.value }));
    setPage(1);
  };

  const handleTypeFilterChange = (type: string) => {
    setFilters(prev => ({ ...prev, type: type === 'all' ? undefined : type }));
    setPage(1);
  };

  const handleStatusFilterChange = (status: string) => {
    setFilters(prev => ({ ...prev, status: status === 'all' ? undefined : status }));
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, notification: Notification) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNotification(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (selectedNotification) {
      try {
        await dashboardService.deleteNotification(selectedNotification.id);
        fetchNotifications();
      } catch (error) {
        setError('Failed to delete notification');
      }
    }
    setDeleteDialogOpen(false);
  };

  const handleSendNotification = async () => {
    if (selectedNotification) {
      try {
        await dashboardService.bulkSendNotifications([selectedNotification.id]);
        fetchNotifications();
      } catch (error) {
        setError('Failed to send notification');
      }
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'success';
      case 'scheduled': return 'warning';
      case 'draft': return 'default';
      case 'delivered': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Notifications & Announcements
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <TextField
            label="Search Notifications"
            variant="outlined"
            value={filters.search || ''}
            onChange={handleSearchChange}
            placeholder="Search by title or message..."
            sx={{ minWidth: 300 }}
          />

          <TextField
            select
            label="Type"
            value={filters.type || 'all'}
            onChange={(e) => handleTypeFilterChange(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="announcement">Announcement</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
            <MenuItem value="payment">Payment</MenuItem>
            <MenuItem value="lease">Lease</MenuItem>
            <MenuItem value="system">System</MenuItem>
          </TextField>

          <TextField
            select
            label="Status"
            value={filters.status || 'all'}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="scheduled">Scheduled</MenuItem>
            <MenuItem value="sent">Sent</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </TextField>

          <Button variant="contained" component={Link} to="/notifications/compose">
            Create Announcement
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ minHeight: 400 }}>
        <Table aria-label="Notifications table">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Recipients</TableCell>
              <TableCell>Scheduled/Sent</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notifications.map((notification) => (
              <TableRow key={notification.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {notification.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notification.message.substring(0, 50)}...
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={notification.type}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={notification.priority}
                    size="small"
                    color={getPriorityColor(notification.priority)}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={notification.status}
                    size="small"
                    color={getStatusColor(notification.status)}
                  />
                </TableCell>
                <TableCell>
                  {notification.recipientNames?.join(', ') || `${notification.recipientIds.length} recipients`}
                </TableCell>
                <TableCell>
                  {notification.scheduledAt ? (
                    <Box>
                      <Typography variant="body2">
                        <ScheduleIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        {new Date(notification.scheduledAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ) : notification.sentAt ? (
                    <Typography variant="body2">
                      {new Date(notification.sentAt).toLocaleDateString()}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Not scheduled
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    aria-label="more actions"
                    onClick={(e) => handleMenuOpen(e, notification)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
          aria-label="Notifications pagination"
        />
      </Box>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleSendNotification} disabled={selectedNotification?.status === 'sent'}>
          <SendIcon sx={{ mr: 1 }} />
          Send Now
        </MenuItem>
        <MenuItem component={Link} to={`/notifications/${selectedNotification?.id}/edit`}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Notification</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this notification? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationList;