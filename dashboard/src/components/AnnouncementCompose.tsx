import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Save as SaveIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  dashboardService,
  CreateAnnouncementData,
  NotificationTemplate,
  Property,
  Tenant
} from '../services/dashboardService';

interface AnnouncementComposeProps {
  editMode?: boolean;
  announcementId?: string;
}

const AnnouncementCompose: React.FC<AnnouncementComposeProps> = ({
  editMode = false,
  announcementId
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [recipientGroups, setRecipientGroups] = useState<string[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [selectedTenants, setSelectedTenants] = useState<Tenant[]>([]);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);

  // Template state
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  // Data for selections
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    fetchTemplates();
    fetchProperties();
    fetchTenants();

    if (editMode && announcementId) {
      fetchAnnouncement();
    }
  }, [editMode, announcementId]);

  const fetchTemplates = async () => {
    try {
      const response = await dashboardService.getNotificationTemplates(1, 50, 'announcement');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await dashboardService.getProperties(1, 100);
      setProperties(response.data);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await dashboardService.getTenants(1, 100);
      setTenants(response.data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    }
  };

  const fetchAnnouncement = async () => {
    if (!announcementId) return;
    setLoading(true);
    try {
      const announcement = await dashboardService.getAnnouncement(announcementId);
      setTitle(announcement.title);
      setContent(announcement.content);
      setPriority(announcement.priority);
      setRecipientGroups(announcement.recipientGroups);
      // Note: In a real implementation, you'd need to fetch and set selected properties/tenants
      if (announcement.scheduledAt) {
        setScheduledAt(new Date(announcement.scheduledAt));
        setIsScheduled(true);
      }
      if (announcement.expiresAt) {
        setExpiresAt(new Date(announcement.expiresAt));
      }
    } catch (error) {
      setError('Failed to fetch announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleRecipientGroupChange = (group: string) => {
    setRecipientGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const handleTemplateSelect = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.subject);
    setContent(template.content);
    setTemplateDialogOpen(false);
  };

  const validateForm = () => {
    if (!title.trim()) return 'Title is required';
    if (!content.trim()) return 'Content is required';
    if (recipientGroups.length === 0 && selectedProperties.length === 0 && selectedTenants.length === 0) {
      return 'At least one recipient group, property, or tenant must be selected';
    }
    return null;
  };

  const handleSave = async (publish: boolean = false) => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const announcementData: CreateAnnouncementData = {
        title: title.trim(),
        content: content.trim(),
        recipientGroups,
        propertyIds: selectedProperties.map(p => p.id),
        tenantIds: selectedTenants.map(t => t.id),
        priority,
        scheduledAt: isScheduled && scheduledAt ? scheduledAt.toISOString() : undefined,
        expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
      };

      if (editMode && announcementId) {
        await dashboardService.updateAnnouncement(announcementId, announcementData);
        setSuccess('Announcement updated successfully');
      } else {
        const announcement = await dashboardService.createAnnouncement(announcementData);
        if (publish) {
          await dashboardService.publishAnnouncement(announcement.id);
          setSuccess('Announcement created and published successfully');
        } else {
          setSuccess('Announcement saved as draft');
        }
      }

      setTimeout(() => {
        navigate('/notifications');
      }, 2000);
    } catch (error) {
      setError('Failed to save announcement');
    } finally {
      setSaving(false);
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          {editMode ? 'Edit Announcement' : 'Create Announcement'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Announcement Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Announcement Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                multiline
                rows={6}
                variant="outlined"
                placeholder="Enter the announcement message..."
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priority}
                  label="Priority"
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<DescriptionIcon />}
                onClick={() => setTemplateDialogOpen(true)}
              >
                Use Template
              </Button>
            </Grid>

            {/* Recipients */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Recipients
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Recipient Groups
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['all-tenants', 'property-managers', 'maintenance-staff'].map((group) => (
                  <Chip
                    key={group}
                    label={group.replace('-', ' ').toUpperCase()}
                    onClick={() => handleRecipientGroupChange(group)}
                    color={recipientGroups.includes(group) ? 'primary' : 'default'}
                    variant={recipientGroups.includes(group) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={properties}
                getOptionLabel={(option) => option.address}
                value={selectedProperties}
                onChange={(event, newValue) => setSelectedProperties(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Specific Properties"
                    placeholder="Select properties..."
                  />
                )}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip
                      label={option.address}
                      {...getTagProps({ index })}
                      size="small"
                    />
                  ))
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={tenants}
                getOptionLabel={(option) => `${option.name} (${option.email})`}
                value={selectedTenants}
                onChange={(event, newValue) => setSelectedTenants(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Specific Tenants"
                    placeholder="Select tenants..."
                  />
                )}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                      size="small"
                    />
                  ))
                }
              />
            </Grid>

            {/* Scheduling */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Scheduling
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                  />
                }
                label="Schedule for later"
              />
            </Grid>

            {isScheduled && (
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Schedule Date & Time"
                  value={scheduledAt}
                  onChange={setScheduledAt}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: isScheduled,
                    },
                  }}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Expiration Date & Time (Optional)"
                value={expiresAt}
                onChange={setExpiresAt}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/notifications')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave(false)}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={20} /> : 'Save Draft'}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SendIcon />}
                  onClick={() => handleSave(true)}
                  disabled={saving || (isScheduled && !scheduledAt)}
                >
                  {saving ? <CircularProgress size={20} /> : isScheduled ? 'Schedule' : 'Publish'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Template Selection Dialog */}
        <Dialog
          open={templateDialogOpen}
          onClose={() => setTemplateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Select Template</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              {templates.map((template) => (
                <Grid item xs={12} sm={6} key={template.id}>
                  <Paper
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <Typography variant="h6">{template.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {template.subject}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Variables: {template.variables.join(', ')}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AnnouncementCompose;