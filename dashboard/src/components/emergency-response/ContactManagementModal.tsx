import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  Autocomplete,
  Stack
} from '@mui/material';
import { EmergencyContact } from '../../types/emergency-response';
import { emergencyResponseService } from '../../services/emergencyResponseService';

interface ContactManagementModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  contact: EmergencyContact | null;
  onClose: () => void;
  onSave: () => void;
}

// Common specialties for autocomplete
const COMMON_SPECIALTIES = [
  'Fire Safety',
  'Medical Emergency',
  'Security',
  'Maintenance',
  'HVAC',
  'Electrical',
  'Plumbing',
  'Locksmith',
  'Property Management',
  'Legal',
  'Insurance',
  'Utilities',
  'Pest Control',
  'Cleaning',
  'Landscaping'
];

// Common roles
const COMMON_ROLES = [
  'Property Manager',
  'Maintenance Supervisor',
  'Security Guard',
  'Fire Marshal',
  'Medical Professional',
  'Electrician',
  'Plumber',
  'HVAC Technician',
  'Locksmith',
  'Legal Counsel',
  'Insurance Agent',
  'Utility Representative',
  'Emergency Coordinator'
];

// Timezone options (simplified list)
const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu'
];

export const ContactManagementModal: React.FC<ContactManagementModalProps> = ({
  open,
  mode,
  contact,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<EmergencyContact>>({
    name: '',
    role: '',
    department: '',
    phone: '',
    email: '',
    alternatePhone: '',
    availability: {
      hours: '9:00-17:00',
      timezone: 'America/New_York',
      onCall: false
    },
    specialties: [],
    priority: 5
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when contact changes
  useEffect(() => {
    if (mode === 'edit' && contact) {
      setFormData(contact);
    } else {
      setFormData({
        name: '',
        role: '',
        department: '',
        phone: '',
        email: '',
        alternatePhone: '',
        availability: {
          hours: '9:00-17:00',
          timezone: 'America/New_York',
          onCall: false
        },
        specialties: [],
        priority: 5
      });
    }
    setError(null);
  }, [mode, contact, open]);

  const handleInputChange = (field: keyof EmergencyContact, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvailabilityChange = (field: keyof EmergencyContact['availability'], value: any) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability!,
        [field]: value
      }
    }));
  };

  const handleSpecialtiesChange = (newSpecialties: string[]) => {
    setFormData(prev => ({
      ...prev,
      specialties: newSpecialties
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name?.trim()) return 'Name is required';
    if (!formData.role?.trim()) return 'Role is required';
    if (!formData.phone?.trim()) return 'Phone number is required';
    
    // Basic phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return 'Please enter a valid phone number';
    }
    
    // Email validation if provided
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return 'Please enter a valid email address';
      }
    }
    
    // Priority validation
    if (formData.priority! < 1 || formData.priority! > 10) {
      return 'Priority must be between 1 and 10';
    }
    
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (mode === 'edit' && contact) {
        await emergencyResponseService.updateEmergencyContact(contact.id, formData);
      } else {
        await emergencyResponseService.createEmergencyContact(formData as Omit<EmergencyContact, 'id'>);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        {mode === 'edit' ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={COMMON_ROLES}
                value={formData.role || ''}
                onChange={(_, value) => handleInputChange('role', value || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Role/Title"
                    required
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department || ''}
                onChange={(e) => handleInputChange('department', e.target.value)}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Priority (1-10)"
                type="number"
                value={formData.priority || 5}
                onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 5)}
                inputProps={{ min: 1, max: 10 }}
                helperText="1 = Highest priority, 10 = Lowest priority"
                disabled={loading}
              />
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Contact Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Primary Phone"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                disabled={loading}
                helperText="Include country code if international"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Alternate Phone"
                value={formData.alternatePhone || ''}
                onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={loading}
              />
            </Grid>

            {/* Availability */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Availability
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Available Hours"
                value={formData.availability?.hours || ''}
                onChange={(e) => handleAvailabilityChange('hours', e.target.value)}
                disabled={loading}
                helperText="Format: 9:00-17:00"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={formData.availability?.timezone || 'America/New_York'}
                  onChange={(e) => handleAvailabilityChange('timezone', e.target.value)}
                  label="Timezone"
                >
                  {TIMEZONES.map((tz) => (
                    <MenuItem key={tz} value={tz}>
                      {tz.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.availability?.onCall || false}
                    onChange={(e) => handleAvailabilityChange('onCall', e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Currently On Call"
              />
            </Grid>

            {/* Specialties */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Specialties
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={COMMON_SPECIALTIES}
                value={formData.specialties || []}
                onChange={(_, value) => handleSpecialtiesChange(value)}
                disabled={loading}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Specialties"
                    placeholder="Add specialties..."
                    helperText="Areas of expertise or emergency types this contact handles"
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : (mode === 'edit' ? 'Update Contact' : 'Add Contact')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};