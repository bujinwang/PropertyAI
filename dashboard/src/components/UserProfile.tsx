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
  Avatar,
  IconButton,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { dashboardService, User } from '../services/dashboardService';

type Values = {
  name: string;
  email: string;
  phone?: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: {
      email: boolean;
      inApp: boolean;
      sms: boolean;
    };
    language: string;
  };
};

interface UserProfileProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  userId?: string;
  isOwnProfile?: boolean; // If true, user can edit their own profile
}

const validationSchema = Yup.object<Values>({
  name: Yup.string().required('Name is required'),
  email: Yup.string().required('Email is required').email('Invalid email format'),
  phone: Yup.string(),
  preferences: Yup.object({
    theme: Yup.string().oneOf(['light', 'dark']).required(),
    notifications: Yup.object({
      email: Yup.boolean().required(),
      inApp: Yup.boolean().required(),
      sms: Yup.boolean().required(),
    }),
    language: Yup.string().required(),
  }),
});

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
];

const UserProfile: React.FC<UserProfileProps> = ({
  open,
  onClose,
  onSubmitSuccess,
  userId,
  isOwnProfile = false,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (open && userId) {
      fetchUser();
    }
  }, [open, userId]);

  const fetchUser = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const userData = await dashboardService.getUser(userId);
      setUser(userData);
      setImagePreview(userData.profileImage || null);
    } catch (err) {
      setError('Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
    if (!userId) return;

    try {
      // Handle profile image upload if changed
      let profileImageUrl = user?.profileImage;
      if (profileImage) {
        // In a real app, upload the image and get the URL
        // For now, we'll just simulate it
        profileImageUrl = 'uploaded-image-url';
      }

      const updateData = {
        ...values,
        profileImage: profileImageUrl,
      };

      await dashboardService.updateUser(userId, updateData);

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error updating user profile:', error);
      setError('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const initialFormValues: Values = {
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    preferences: user?.preferences || {
      theme: 'light',
      notifications: {
        email: true,
        inApp: true,
        sms: false,
      },
      language: 'en',
    },
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Typography>Loading user profile...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {isOwnProfile ? 'My Profile' : 'Edit User Profile'}
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
                {error && <Alert severity="error">{error}</Alert>}

                {/* Profile Image */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={imagePreview || undefined}
                    sx={{ width: 100, height: 100 }}
                  >
                    {values.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="profile-image"
                      type="file"
                      onChange={handleImageChange}
                    />
                    <label htmlFor="profile-image">
                      <IconButton color="primary" component="span">
                        <PhotoCamera />
                      </IconButton>
                    </label>
                    <Typography variant="caption" color="text.secondary">
                      Change Profile Picture
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                {/* Basic Information */}
                <Typography variant="subtitle1" fontWeight="medium">
                  Basic Information
                </Typography>

                <FormControl fullWidth error={Boolean(touched.name && errors.name)}>
                  <Field
                    as={TextField}
                    name="name"
                    label="Full Name"
                    fullWidth
                    required
                    helperText={touched.name && errors.name ? (errors.name as string) : ''}
                  />
                </FormControl>

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

                <FormControl fullWidth>
                  <Field
                    as={TextField}
                    name="phone"
                    label="Phone Number"
                    fullWidth
                    helperText={touched.phone && errors.phone ? (errors.phone as string) : ''}
                  />
                </FormControl>

                <Divider />

                {/* Preferences */}
                <Typography variant="subtitle1" fontWeight="medium">
                  Preferences
                </Typography>

                <FormControl fullWidth>
                  <InputLabel>Theme</InputLabel>
                  <Field
                    as={Select}
                    name="preferences.theme"
                    label="Theme"
                    value={values.preferences.theme}
                    onChange={(e: any) => setFieldValue('preferences.theme', e.target.value)}
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                  </Field>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Field
                    as={Select}
                    name="preferences.language"
                    label="Language"
                    value={values.preferences.language}
                    onChange={(e: any) => setFieldValue('preferences.language', e.target.value)}
                  >
                    {languages.map((lang) => (
                      <MenuItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </MenuItem>
                    ))}
                  </Field>
                </FormControl>

                <Divider />

                {/* Notification Preferences */}
                <Typography variant="subtitle1" fontWeight="medium">
                  Notification Preferences
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={values.preferences.notifications.email}
                      onChange={(e) => setFieldValue('preferences.notifications.email', e.target.checked)}
                    />
                  }
                  label="Email Notifications"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={values.preferences.notifications.inApp}
                      onChange={(e) => setFieldValue('preferences.notifications.inApp', e.target.checked)}
                    />
                  }
                  label="In-App Notifications"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={values.preferences.notifications.sms}
                      onChange={(e) => setFieldValue('preferences.notifications.sms', e.target.checked)}
                    />
                  }
                  label="SMS Notifications"
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                Save Changes
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default UserProfile;