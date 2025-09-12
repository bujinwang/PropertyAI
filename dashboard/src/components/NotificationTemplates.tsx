import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { dashboardService, NotificationTemplate, CreateNotificationTemplateData } from '../services/dashboardService';

const NotificationTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'announcement' | 'maintenance' | 'payment' | 'lease' | 'system'>('announcement');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [variables, setVariables] = useState<string[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getNotificationTemplates(1, 50);
      setTemplates(response.data);
    } catch (err) {
      setError('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template?: NotificationTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setName(template.name);
      setType(template.type);
      setSubject(template.subject);
      setContent(template.content);
      setVariables(template.variables);
    } else {
      setEditingTemplate(null);
      setName('');
      setType('announcement');
      setSubject('');
      setContent('');
      setVariables([]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setName('');
    setSubject('');
    setContent('');
    setVariables([]);
  };

  const handleSave = async () => {
    if (!name.trim() || !subject.trim() || !content.trim()) {
      setError('Name, subject, and content are required');
      return;
    }

    setError(null);
    try {
      const templateData: CreateNotificationTemplateData = {
        name: name.trim(),
        type,
        subject: subject.trim(),
        content: content.trim(),
        variables,
      };

      if (editingTemplate) {
        await dashboardService.updateNotificationTemplate(editingTemplate.id, templateData);
      } else {
        await dashboardService.createNotificationTemplate(templateData);
      }

      fetchTemplates();
      handleCloseDialog();
    } catch (error) {
      setError('Failed to save template');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await dashboardService.deleteNotificationTemplate(templateId);
      fetchTemplates();
    } catch (error) {
      setError('Failed to delete template');
    }
  };

  const addVariable = () => {
    const newVariable = prompt('Enter variable name (without curly braces):');
    if (newVariable && !variables.includes(newVariable)) {
      setVariables([...variables, newVariable]);
    }
  };

  const removeVariable = (variable: string) => {
    setVariables(variables.filter(v => v !== variable));
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Notification Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Template
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table aria-label="Notification templates table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Variables</TableCell>
              <TableCell>Usage Count</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" fontWeight="medium">
                      {template.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={template.type}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {template.subject}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {template.variables.map((variable) => (
                      <Chip
                        key={variable}
                        label={`{${variable}}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {template.usageCount || 0}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    aria-label="edit template"
                    onClick={() => handleOpenDialog(template)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    aria-label="delete template"
                    onClick={() => handleDelete(template.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Template Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTemplate ? 'Edit Template' : 'Create Template'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Template Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={type}
                label="Type"
                onChange={(e) => setType(e.target.value as typeof type)}
              >
                <MenuItem value="announcement">Announcement</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="payment">Payment</MenuItem>
                <MenuItem value="lease">Lease</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <TextField
              fullWidth
              label="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              multiline
              rows={6}
              required
              placeholder="Enter template content. Use {variableName} for dynamic content."
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Variables
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                {variables.map((variable) => (
                  <Chip
                    key={variable}
                    label={variable}
                    onDelete={() => removeVariable(variable)}
                    size="small"
                  />
                ))}
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={addVariable}
              >
                Add Variable
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationTemplates;