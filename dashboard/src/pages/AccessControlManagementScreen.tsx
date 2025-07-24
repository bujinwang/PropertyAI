import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  usersCount: number;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  lastLogin: string;
}

interface TemporaryAccess {
  id: string;
  userId: string;
  userName: string;
  resource: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'revoked';
  grantedBy: string;
}

interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
  success: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`access-tabpanel-${index}`}
      aria-labelledby={`access-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AccessControlManagementScreen: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tempAccess, setTempAccess] = useState<TemporaryAccess[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showTempAccessForm, setShowTempAccessForm] = useState(false);

  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    roleId: '',
  });

  const [newTempAccess, setNewTempAccess] = useState({
    userId: '',
    resource: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolesData, permissionsData, usersData, tempAccessData, logsData] = await Promise.all([
        apiService.get('/api/access-control/roles'),
        apiService.get('/api/access-control/permissions'),
        apiService.get('/api/access-control/users'),
        apiService.get('/api/access-control/temporary-access'),
        apiService.get('/api/access-control/logs'),
      ]);
      setRoles(rolesData.data);
      setPermissions(permissionsData.data);
      setUsers(usersData.data);
      setTempAccess(tempAccessData.data);
      setAccessLogs(logsData.data);
    } catch (error) {
      console.error('Error loading access control data:', error);
    }
  };

  const handleCreateRole = async () => {
    try {
      await apiService.post('/api/access-control/roles', newRole);
      setShowRoleForm(false);
      setNewRole({ name: '', description: '', permissions: [] });
      loadData();
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      await apiService.post('/api/access-control/users', newUser);
      setShowUserForm(false);
      setNewUser({ email: '', firstName: '', lastName: '', roleId: '' });
      loadData();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleCreateTempAccess = async () => {
    try {
      await apiService.post('/api/access-control/temporary-access', newTempAccess);
      setShowTempAccessForm(false);
      setNewTempAccess({ userId: '', resource: '', startDate: '', endDate: '' });
      loadData();
    } catch (error) {
      console.error('Error creating temporary access:', error);
    }
  };

  const handleToggleRole = async (roleId: string, isActive: boolean) => {
    try {
      await apiService.put(`/api/access-control/roles/${roleId}/toggle`, { isActive });
      loadData();
    } catch (error) {
      console.error('Error toggling role:', error);
    }
  };

  const handleToggleUser = async (userId: string, isActive: boolean) => {
    try {
      await apiService.put(`/api/access-control/users/${userId}/toggle`, { isActive });
      loadData();
    } catch (error) {
      console.error('Error toggling user:', error);
    }
  };

  const handleRevokeTempAccess = async (accessId: string) => {
    try {
      await apiService.put(`/api/access-control/temporary-access/${accessId}/revoke`);
      loadData();
    } catch (error) {
      console.error('Error revoking temporary access:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'warning';
      case 'revoked': return 'error';
      default: return 'default';
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Access Control Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="access control tabs">
          <Tab label="Roles" icon={<SecurityIcon />} />
          <Tab label="Users" icon={<PersonIcon />} />
          <Tab label="Temporary Access" icon={<ScheduleIcon />} />
          <Tab label="Access Logs" icon={<HistoryIcon />} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Role Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowRoleForm(true)}
          >
            Create Role
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {role.permissions.slice(0, 3).map((perm) => (
                        <Chip key={perm} label={perm} size="small" variant="outlined" />
                      ))}
                      {role.permissions.length > 3 && (
                        <Chip label={`+${role.permissions.length - 3}`} size="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{role.usersCount}</TableCell>
                  <TableCell>
                    <Chip
                      label={role.isActive ? 'Active' : 'Inactive'}
                      color={role.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton onClick={() => handleToggleRole(role.id, !role.isActive)}>
                        {role.isActive ? <LockIcon /> : <LockOpenIcon />}
                      </IconButton>
                      <IconButton>
                        <EditIcon />
                      </IconButton>
                      <IconButton>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">User Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowUserForm(true)}
          >
            Add User
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.roleName}</TableCell>
                  <TableCell>{formatDate(user.lastLogin)}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton onClick={() => handleToggleUser(user.id, !user.isActive)}>
                        {user.isActive ? <LockIcon /> : <LockOpenIcon />}
                      </IconButton>
                      <IconButton>
                        <EditIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Temporary Access</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowTempAccessForm(true)}
          >
            Grant Access
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tempAccess.map((access) => (
                <TableRow key={access.id}>
                  <TableCell>{access.userName}</TableCell>
                  <TableCell>{access.resource}</TableCell>
                  <TableCell>{formatDate(access.startDate)}</TableCell>
                  <TableCell>{formatDate(access.endDate)}</TableCell>
                  <TableCell>
                    <Chip
                      label={access.status}
                      color={getStatusColor(access.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton onClick={() => handleRevokeTempAccess(access.id)}>
                        <CancelIcon />
                      </IconButton>
                      <IconButton>
                        <VisibilityIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography variant="h5" gutterBottom>
          Access Logs
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accessLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.userName}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell>{formatDate(log.timestamp)}</TableCell>
                  <TableCell>{log.ipAddress}</TableCell>
                  <TableCell>
                    <Chip
                      label={log.success ? 'Success' : 'Failed'}
                      color={log.success ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Dialogs */}
      <Dialog open={showRoleForm} onClose={() => setShowRoleForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Role Name"
              value={newRole.name}
              onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={newRole.description}
              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Permissions</InputLabel>
              <Select
                multiple
                value={newRole.permissions}
                onChange={(e) => setNewRole({ ...newRole, permissions: e.target.value as string[] })}
              >
                {permissions.map((permission) => (
                  <MenuItem key={permission.id} value={permission.name}>
                    {permission.name} - {permission.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRoleForm(false)}>Cancel</Button>
          <Button onClick={handleCreateRole} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showUserForm} onClose={() => setShowUserForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="First Name"
              value={newUser.firstName}
              onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Last Name"
              value={newUser.lastName}
              onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={newUser.roleId}
                onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUserForm(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained">Add User</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showTempAccessForm} onClose={() => setShowTempAccessForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>Grant Temporary Access</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>User</InputLabel>
              <Select
                value={newTempAccess.userId}
                onChange={(e) => setNewTempAccess({ ...newTempAccess, userId: e.target.value })}
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {`${user.firstName} ${user.lastName} (${user.email})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Resource"
              value={newTempAccess.resource}
              onChange={(e) => setNewTempAccess({ ...newTempAccess, resource: e.target.value })}
              fullWidth
            />
            <TextField
              label="Start Date"
              type="datetime-local"
              value={newTempAccess.startDate}
              onChange={(e) => setNewTempAccess({ ...newTempAccess, startDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="datetime-local"
              value={newTempAccess.endDate}
              onChange={(e) => setNewTempAccess({ ...newTempAccess, endDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTempAccessForm(false)}>Cancel</Button>
          <Button onClick={handleCreateTempAccess} variant="contained">Grant Access</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccessControlManagementScreen;