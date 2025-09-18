import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  Checkbox,
  Box,
  Typography,
  Alert,
  TextField,
} from '@mui/material';

// API service for templates
const templatesApi = {
  create: async (data: any) => {
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create template');
    return response.json();
  },

  save: async (userId: string, templateName: string, layout: any, role: string) => {
    const response = await fetch('/api/templates/save', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, templateName, layout, role })
    });
    if (!response.ok) throw new Error('Failed to save template');
    return response.json();
  },

  getUserTemplates: async (userId: string, role?: string) => {
    const url = role ? `/api/templates/user/${userId}?role=${role}` : `/api/templates/user/${userId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch templates');
    return response.json();
  },

  getAccessibleTemplates: async (role?: string) => {
    const url = role ? `/api/templates/accessible?role=${role}` : '/api/templates/accessible';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch accessible templates');
    return response.json();
  }
};

interface AlertTemplatesEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (template: any) => void;
  availableComponents: string[]; // e.g., ['AlertGroupView', 'Chart', 'Table']
  currentTemplate?: any; // Current layout if editing
  userId: string;
  role: string;
}

const AlertTemplatesEditor: React.FC<AlertTemplatesEditorProps> = ({
  open,
  onClose,
  onSave,
  availableComponents,
  currentTemplate,
  userId,
  role,
}) => {
  const [templateName, setTemplateName] = useState(currentTemplate?.templateName || '');
  const [selectedComponents, setSelectedComponents] = useState<string[]>(currentTemplate?.layout || []);
  const [error, setError] = useState('');

  const handleToggleComponent = (component: string) => {
    setSelectedComponents(prev =>
      prev.includes(component)
        ? prev.filter(c => c !== component)
        : [...prev, component]
    );
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    try {
      const layout = selectedComponents.map(comp => ({ type: comp, position: 'auto' })); // Simple layout
      await TemplateService.saveTemplate(userId, templateName, layout, role);
      onSave({ templateName, layout });
      setError('');
      onClose();
    } catch (err) {
      setError('Failed to save template');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create/Edit Template</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Template Name
          </Typography>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter template name"
            className="w-full p-2 border rounded"
          />
        </Box>
        <Typography variant="subtitle1" gutterBottom>
          Select Components
        </Typography>
        <List>
          {availableComponents.map((comp) => (
            <ListItem key={comp}>
              <Checkbox
                checked={selectedComponents.includes(comp)}
                onChange={() => handleToggleComponent(comp)}
              />
              <Typography>{comp}</Typography>
            </ListItem>
          ))}
        </List>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Template
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertTemplatesEditor;
