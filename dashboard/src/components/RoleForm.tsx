import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Typography,
  Box,
  Chip,
  Checkbox,
  ListItemText,
  FormControlLabel,
  Alert,
} from '@mui/material';
import { dashboardService, Role, Permission } from '../services/dashboardService';

type Values = {
  name: string;
  description: string;
  level: number;
  permissions: string[];
  customPermissions: boolean;
};

interface RoleFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  initialValues?: Partial<Values>;
  isEdit?: boolean;
  roleId?: string;
}

const validationSchema = Yup.object<Values>({
  name: Yup.string().required('Name is required'),
  description: Yup.string().required('Description is required'),
  level: Yup.number().required('Level is required').min(1).max(4),
  permissions: Yup.array().of(Yup.string()).min(1, 'At least one permission is required'),
  customPermissions: Yup.boolean(),
});

const roleLevels = [
  { value: 1, label: 'Admin' },
  { value: 2, label: 'Manager' },
  { value: 3, label: 'Staff' },
  { value: 4, label: 'Tenant' },
];

// Define available permissions - in a real app, this would come from the API
const availablePermissions = [
  // Properties
  'properties:create', 'properties:read', 'properties:update', 'properties:delete',
  // Units
  'units:create', 'units:read', 'units:update', 'units:delete',
  // Tenants
  'tenants:create', 'tenants:read', 'tenants:update', 'tenants:delete',
  // Leases
  'leases:create', 'leases:read', 'leases:update', 'leases:delete',
  // Payments
  'payments:create', 'payments:read', 'payments:update', 'payments:delete',
  // Maintenance
  'maintenance:create', 'maintenance:read', 'maintenance:update', 'maintenance:delete',
  // Documents
  'documents:create', 'documents:read', 'documents:update', 'documents:delete',
  // Messages
  'messages:create', 'messages:read', 'messages:update', 'messages:delete',
  // Notifications
  'notifications:create', 'notifications:read', 'notifications:update', 'notifications:delete',
  // Users
  'users:create', 'users:read', 'users:update', 'users:delete',
  // Roles
  'roles:create', 'roles:read', 'roles:update', 'roles:delete',
  // Audit logs
  'audit:read',
];

const RoleForm: React.FC<RoleFormProps> = ({
  open,
  onClose,
  onSubmitSuccess,
  initialValues = {},
  isEdit = false,
  roleId
}) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoadingPermissions(true);
      try {
        const perms = await dashboardService.getPermissions();
        setPermissions(perms);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      } finally {
        setLoadingPermissions(false);
      }
    };

    if (open) {
      fetchPermissions();
    }
  }, [open]);

  const handleSubmit = async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
    try {
      if (isEdit && roleId) {
        await dashboardService.updateRole(roleId, values);
      } else {
        await dashboardService.createRole(values);
      }
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const initialFormValues: Values = {
    name: initialValues.name || '',
    description: initialValues.description || '',
    level: initialValues.level || 4,
    permissions: initialValues.permissions || [],
    customPermissions: initialValues.customPermissions || false,
  };

  const getPermissionLabel = (permission: string) => {
    const [resource, action] = permission.split(':');
    return `${resource.charAt(0).toUpperCase() + resource.slice(1)} - ${action.charAt(0).toUpperCase() + action.slice(1)}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {isEdit ? 'Edit Role' : 'Create New Role'}
        </Typography>
      </DialogTitle>
      <Formik
        initialValues={initialFormValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, errors, touched, setFieldValue, values }) => (
          <Form>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                <FormControl fullWidth error={Boolean(touched.name && errors.name)}>
                  <Field
                    as={TextField}
                    name="name"
                    label="Role Name"
                    fullWidth
                    required
                    helperText={touched.name && errors.name ? (errors.name as string) : ''}
                  />
                </FormControl>

                <FormControl fullWidth error={Boolean(touched.description && errors.description)}>
                  <Field
                    as={TextField}
                    name="description"
                    label="Description"
                    fullWidth
                    required
                    multiline
                    rows={3}
                    helperText={touched.description && errors.description ? (errors.description as string) : ''}
                  />
                </FormControl>

                <FormControl fullWidth error={Boolean(touched.level && errors.level)}>
                  <InputLabel>Role Level</InputLabel>
                  <Field
                    as={Select}
                    name="level"
                    label="Role Level"
                    required
                    onChange={(e: React.ChangeEvent<{ value: unknown }>) => setFieldValue('level', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select Level</em>
                    </MenuItem>
                    {roleLevels.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Field>
                  {touched.level && errors.level && (
                    <FormHelperText>{errors.level as string}</FormHelperText>
                  )}
                </FormControl>

                <FormControl fullWidth error={Boolean(touched.permissions && errors.permissions)}>
                  <InputLabel>Permissions</InputLabel>
                  <Field
                    as={Select}
                    name="permissions"
                    label="Permissions"
                    multiple
                    value={values.permissions}
                    onChange={(e: React.ChangeEvent<{ value: unknown }>) => {
                      const value = e.target.value as string[];
                      setFieldValue('permissions', value);
                    }}
                    renderValue={(selected: string[]) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={getPermissionLabel(value)} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {availablePermissions.map((permission) => (
                      <MenuItem key={permission} value={permission}>
                        <Checkbox checked={values.permissions.indexOf(permission) > -1} />
                        <ListItemText primary={getPermissionLabel(permission)} />
                      </MenuItem>
                    ))}
                  </Field>
                  {touched.permissions && errors.permissions && (
                    <FormHelperText>{errors.permissions as string}</FormHelperText>
                  )}
                </FormControl>

                <FormControlLabel
                  control={
                    <Field
                      as={Checkbox}
                      name="customPermissions"
                      checked={values.customPermissions}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('customPermissions', e.target.checked)}
                    />
                  }
                  label="Allow custom permissions for users with this role"
                />

                {values.permissions.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected Permissions ({values.permissions.length}):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {values.permissions.map((permission) => (
                        <Chip
                          key={permission}
                          label={getPermissionLabel(permission)}
                          size="small"
                          onDelete={() => {
                            const newPermissions = values.permissions.filter(p => p !== permission);
                            setFieldValue('permissions', newPermissions);
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isEdit ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default RoleForm;