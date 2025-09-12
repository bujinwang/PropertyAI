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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { dashboardService, Role } from '../services/dashboardService';

interface RoleListProps {
  onEdit?: (role: Role) => void;
  onCreate?: () => void;
  onBulkDelete?: (roleIds: string[]) => void;
  selectable?: boolean;
}

const RoleList: React.FC<RoleListProps> = ({
  onEdit,
  onCreate,
  onBulkDelete,
  selectable = false,
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  const [selected, setSelected] = useState<string[]>([]);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getRoles(page, limit, { search: searchTerm });
      setRoles(response.data);
      setTotal(response.total);
    } catch (err) {
      setError('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [page, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(roles.map((role) => role.id));
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

  const getRoleLevelLabel = (level: number) => {
    switch (level) {
      case 1:
        return 'Admin';
      case 2:
        return 'Manager';
      case 3:
        return 'Staff';
      case 4:
        return 'Tenant';
      default:
        return 'Unknown';
    }
  };

  const getRoleLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return 'error';
      case 2:
        return 'warning';
      case 3:
        return 'info';
      case 4:
        return 'success';
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
        Roles
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label="Search Roles"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name or description..."
            sx={{ minWidth: 300 }}
          />
          {onCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreate}
              size="small"
            >
              Add Role
            </Button>
          )}
        </Box>
      </Box>

      {selected.length > 0 && onBulkDelete && (
        <Toolbar sx={{ bgcolor: 'action.selected' }}>
          <Typography variant="subtitle1" component="div">
            {selected.length} selected
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleBulkDelete}
            size="small"
          >
            Delete Selected
          </Button>
        </Toolbar>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Roles table">
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < roles.length}
                    checked={roles.length > 0 && selected.length === roles.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id} selected={selected.includes(role.id)}>
                {selectable && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(role.id)}
                      onChange={() => handleSelect(role.id)}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {role.name}
                  </Typography>
                </TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  <Chip
                    label={getRoleLevelLabel(role.level)}
                    color={getRoleLevelColor(role.level)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {role.permissions.length} permissions
                  </Typography>
                </TableCell>
                <TableCell>
                  {new Date(role.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    {onEdit && (
                      <Tooltip title="Edit Role">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(role)}
                          aria-label="Edit role"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={selectable ? 7 : 6} align="center">
                  <Typography color="text.secondary">No roles found</Typography>
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
            aria-label="Roles pagination"
          />
        </Box>
      )}
    </Box>
  );
};

export default RoleList;