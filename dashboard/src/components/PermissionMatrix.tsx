import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { dashboardService, Role, Permission } from '../services/dashboardService';

interface PermissionMatrixProps {
  editable?: boolean;
  onPermissionsChange?: (roleId: string, permissions: string[]) => void;
}

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  editable = false,
  onPermissionsChange,
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    roleId: string;
    permission: string;
    action: 'add' | 'remove';
  }>({ open: false, roleId: '', permission: '', action: 'add' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rolesData, permissionsData] = await Promise.all([
          dashboardService.getRoles(1, 100), // Get all roles
          dashboardService.getPermissions(),
        ]);
        setRoles(rolesData.data);
        setPermissions(permissionsData);
      } catch (err) {
        setError('Failed to fetch roles and permissions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group permissions by resource
  const permissionGroups = permissions.reduce((acc, perm) => {
    const [resource] = perm.name.split(':');
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getRoleLevelLabel = (level: number) => {
    switch (level) {
      case 1: return 'Admin';
      case 2: return 'Manager';
      case 3: return 'Staff';
      case 4: return 'Tenant';
      default: return 'Unknown';
    }
  };

  const getRoleLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'error';
      case 2: return 'warning';
      case 3: return 'info';
      case 4: return 'success';
      default: return 'default';
    }
  };

  const hasPermission = (role: Role, permissionName: string) => {
    return role.permissions.includes(permissionName);
  };

  const handlePermissionToggle = (roleId: string, permissionName: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const hasPerm = hasPermission(role, permissionName);
    setConfirmDialog({
      open: true,
      roleId,
      permission: permissionName,
      action: hasPerm ? 'remove' : 'add',
    });
  };

  const handleConfirmPermissionChange = async () => {
    const { roleId, permission, action } = confirmDialog;
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    try {
      let newPermissions: string[];
      if (action === 'add') {
        newPermissions = [...role.permissions, permission];
      } else {
        newPermissions = role.permissions.filter(p => p !== permission);
      }

      await dashboardService.updateRole(roleId, { permissions: newPermissions });

      // Update local state
      setRoles(roles.map(r =>
        r.id === roleId ? { ...r, permissions: newPermissions } : r
      ));

      if (onPermissionsChange) {
        onPermissionsChange(roleId, newPermissions);
      }
    } catch (error) {
      setError('Failed to update role permissions');
    }

    setConfirmDialog({ open: false, roleId: '', permission: '', action: 'add' });
  };

  const handleCancelPermissionChange = () => {
    setConfirmDialog({ open: false, roleId: '', permission: '', action: 'add' });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const allActions = ['create', 'read', 'update', 'delete'];

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom>
        Permission Matrix
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Overview of permissions assigned to each role
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small" aria-label="Permission matrix">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Role</TableCell>
              {Object.keys(permissionGroups).map((resource) => (
                <TableCell key={resource} align="center" sx={{ fontWeight: 'bold', minWidth: 200 }}>
                  {resource.charAt(0).toUpperCase() + resource.slice(1)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {role.name}
                    </Typography>
                    <Chip
                      label={getRoleLevelLabel(role.level)}
                      color={getRoleLevelColor(role.level)}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </TableCell>
                {Object.keys(permissionGroups).map((resource) => (
                  <TableCell key={resource} align="center">
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {allActions.map((action) => {
                        const permissionName = `${resource}:${action}`;
                        const hasPerm = hasPermission(role, permissionName);
                        return (
                          <Box key={action} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>
                              {action}:
                            </Typography>
                            <Checkbox
                              size="small"
                              checked={hasPerm}
                              onChange={() => editable && handlePermissionToggle(role.id, permissionName)}
                              disabled={!editable}
                              sx={{ p: 0 }}
                            />
                          </Box>
                        );
                      })}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelPermissionChange}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Permission Change</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {confirmDialog.action} the "{confirmDialog.permission}" permission
            for this role?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelPermissionChange}>Cancel</Button>
          <Button onClick={handleConfirmPermissionChange} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PermissionMatrix;