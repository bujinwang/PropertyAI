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
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { dashboardService, Role, UserInvitation as Invitation } from '../services/dashboardService';

type Values = {
  email: string;
  roleId: string;
  message?: string;
};

interface UserInvitationProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

const validationSchema = Yup.object<Values>({
  email: Yup.string().required('Email is required').email('Invalid email format'),
  roleId: Yup.string().required('Role is required'),
  message: Yup.string(),
});

const UserInvitation: React.FC<UserInvitationProps> = ({
  open,
  onClose,
  onSubmitSuccess,
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInvitations, setShowInvitations] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRoles();
      fetchInvitations();
    }
  }, [open]);

  const fetchRoles = async () => {
    try {
      const response = await dashboardService.getRoles(1, 100);
      setRoles(response.data);
    } catch (err) {
      console.error('Failed to fetch roles');
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await dashboardService.getUserInvitations();
      setInvitations(response.data);
    } catch (err) {
      console.error('Failed to fetch invitations');
    }
  };

  const handleSubmit = async (values: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
    setLoading(true);
    setError(null);
    try {
      await dashboardService.inviteUser(values);
      resetForm();
      fetchInvitations();
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setError('Failed to send invitation');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await dashboardService.cancelInvitation(invitationId);
      fetchInvitations();
    } catch (error) {
      console.error('Error canceling invitation:', error);
      setError('Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await dashboardService.resendInvitation(invitationId);
      fetchInvitations();
    } catch (error) {
      console.error('Error resending invitation:', error);
      setError('Failed to resend invitation');
    }
  };

  const getStatusColor = (status: Invitation['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'expired':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const initialFormValues: Values = {
    email: '',
    roleId: '',
    message: '',
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Invite New User
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Formik
            initialValues={initialFormValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched, setFieldValue }) => (
              <Form>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Send Invitation
                </Typography>

                <FormControl fullWidth error={Boolean(touched.email && errors.email)}>
                  <Field
                    as={TextField}
                    name="email"
                    label="Email Address"
                    type="email"
                    fullWidth
                    required
                    helperText={touched.email && errors.email ? (errors.email as string) : ''}
                  />
                </FormControl>

                <FormControl fullWidth error={Boolean(touched.roleId && errors.roleId)}>
                  <InputLabel>Role</InputLabel>
                  <Field
                    as={Select}
                    name="roleId"
                    label="Role"
                    required
                    onChange={(e: any) => setFieldValue('roleId', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select Role</em>
                    </MenuItem>
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name} - {role.description}
                      </MenuItem>
                    ))}
                  </Field>
                  {touched.roleId && errors.roleId && (
                    <FormHelperText>{errors.roleId as string}</FormHelperText>
                  )}
                </FormControl>

                <FormControl fullWidth>
                  <Field
                    as={TextField}
                    name="message"
                    label="Personal Message (Optional)"
                    multiline
                    rows={3}
                    fullWidth
                    placeholder="Add a personal message to the invitation email..."
                    helperText={touched.message && errors.message ? (errors.message as string) : ''}
                  />
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SendIcon />}
                    disabled={isSubmitting || loading}
                  >
                    Send Invitation
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>

          <Divider />

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Recent Invitations
              </Typography>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={fetchInvitations}
              >
                Refresh
              </Button>
            </Box>

            {invitations.length === 0 ? (
              <Typography color="text.secondary">No invitations sent yet</Typography>
            ) : (
              <List dense>
                {invitations.slice(0, 10).map((invitation) => (
                  <ListItem key={invitation.id} divider>
                    <ListItemText
                      primary={invitation.email}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={invitation.status}
                            size="small"
                            color={getStatusColor(invitation.status)}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {invitation.roleName} • Sent {new Date(invitation.createdAt).toLocaleDateString()}
                          </Typography>
                          {invitation.status === 'accepted' && invitation.acceptedAt && (
                            <Typography variant="caption" color="text.secondary">
                              • Accepted {new Date(invitation.acceptedAt).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {invitation.status === 'pending' && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleResendInvitation(invitation.id)}
                              title="Resend invitation"
                            >
                              <SendIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleCancelInvitation(invitation.id)}
                              title="Cancel invitation"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserInvitation;