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
  IconButton,
  Checkbox,
  Toolbar,
  Tooltip,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import { dashboardService, User, Role } from '../services/dashboardService';

interface UserListProps {
  onEdit?: (user: User) => void;
  onCreate?: () => void;
  onBulkDelete?: (userIds: string[]) => void;
  onBulkStatusChange?: (userIds: string[], status: User['status']) => void;
  onBulkRoleChange?: (userIds: string[], roleId: string) => void;
  selectable?: boolean;
}

const UserList: React.FC<UserListProps> = ({
  onEdit,
  onCreate,
  onBulkDelete,
  onBulkStatusChange,
  onBulkRoleChange,
  selectable = false,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  const [selected, setSelected] = useState<string[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = { search: searchTerm };
      if (statusFilter) filters.status = statusFilter;
      if (roleFilter) filters.roleId = roleFilter;

      const response = await dashboardService.getUsers(page, limit, filters);
      setUsers(response.data);
      setTotal(response.total);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await dashboardService.getRoles(1, 100);
      setRoles(response.data);
    } catch (err) {
      console.error('Failed to fetch roles');
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, statusFilter, roleFilter]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value as string);
    setPage(1);
  };

  const handleRoleFilterChange = (event: any) => {
    setRoleFilter(event.target.value as string);
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(users.map((user) => user.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selected.length > 0) {
      onBulkDelete(selected);
      setSelected([]);
    }
  };

  const handleBulkStatusChange = (status: User['status']) => {
    if (onBulkStatusChange && selected.length > 0) {
      onBulkStatusChange(selected, status);
      setSelected([]);
    }
  };

  const handleBulkRoleChange = (roleId: string) => {
    if (onBulkRoleChange && selected.length > 0) {
      onBulkRoleChange(selected, roleId);
      setSelected([]);
    }
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'pending':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'default';
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
      <Typography variant="h6" component="h2" gutterBottom>
        Users
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label="Search Users"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name or email..."
            sx={{ minWidth: 250 }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="">
                <em>All Status</em>
              </MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={handleRoleFilterChange}
            >
              <MenuItem value="">
                <em>All Roles</em>
              </MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {onCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreate}
              size="small"
            >
              Add User
            </Button>
          )}
        </Box>
      </Box>

      {selected.length > 0 && (onBulkDelete || onBulkStatusChange || onBulkRoleChange) && (
        <Toolbar sx={{ bgcolor: 'action.selected' }}>
          <Typography variant="subtitle1" component="div" sx={{ mr: 2 }}>
            {selected.length} selected
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {onBulkStatusChange && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleBulkStatusChange('active')}
                >
                  Activate
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleBulkStatusChange('inactive')}
                >
                  Deactivate
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => handleBulkStatusChange('suspended')}
                >
                  Suspend
                </Button>
              </>
            )}
            {onBulkRoleChange && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Change Role</InputLabel>
                <Select
                  label="Change Role"
                  onChange={(e) => handleBulkRoleChange(e.target.value as string)}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {onBulkDelete && (
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDelete}
                size="small"
              >
                Delete Selected
              </Button>
            )}
          </Box>
        </Toolbar>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Users table">
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < users.length}
                    checked={users.length > 0 && selected.length === users.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} selected={selected.includes(user.id)}>
                {selectable && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(user.id)}
                      onChange={() => handleSelect(user.id)}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="action" />
                    <Typography variant="body2" fontWeight="medium">
                      {user.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.roleName || 'Unknown'}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status}
                    size="small"
                    color={getStatusColor(user.status)}
                  />
                </TableCell>
                <TableCell>
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    {onEdit && (
                      <Tooltip title="Edit User">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(user)}
                          aria-label="Edit user"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={selectable ? 8 : 7} align="center">
                  <Typography color="text.secondary">No users found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            aria-label="Users pagination"
          />
        </Box>
      )}
    </Box>
  );
};

export default UserList;