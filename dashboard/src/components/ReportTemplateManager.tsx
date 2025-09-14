import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { reportingService, ReportTemplate } from '../services/reportingService';

interface SectionConfig {
  type: 'summary' | 'chart' | 'table' | 'insight';
  dataSource: string;
  visualization: 'bar' | 'line' | 'pie' | 'table' | 'text';
  title: string;
}

interface TemplateFormData {
  name: string;
  description: string;
  sections: SectionConfig[];
  schedule: {
    frequency: 'monthly' | 'daily' | 'weekly' | 'quarterly';
    dayOfMonth: number;
    recipients: string[];
    format: 'pdf' | 'csv' | 'excel';
  };
}

const ReportTemplateManager: React.FC = () => {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    sections: [],
    schedule: { frequency: 'monthly', dayOfMonth: 1, recipients: [], format: 'pdf' }
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSection = () => {
    const newSection: SectionConfig = {
      type: 'summary',
      dataSource: 'financial',
      visualization: 'text',
      title: 'New Section'
    };
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const removeSection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const updateSection = (index: number, updatedSection: Partial<SectionConfig>) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) => i === index ? { ...s, ...updatedSection } : s)
    }));
  };

  const updateSectionVisualization = (index: number, visualization: 'bar' | 'line' | 'pie' | 'table' | 'text') => {
    updateSection(index, { visualization });
  };

  const saveTemplate = async () => {
    if (!formData.name.trim()) {
      setError('Template name is required');
      return;
    }

    setLoading(true);
    try {
      const templateData = {
        name: formData.name,
        description: formData.description,
        sections: formData.sections,
        schedule: formData.schedule
      };
      // In production, post to backend
      console.log('Saving template:', templateData);
      setError(null);
      // Reset form or close dialog
      setIsDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Report Template Manager
        </Typography>
        <Button variant="outlined" startIcon={<AddCircleIcon />} onClick={() => setIsDialogOpen(true)}>
          Create New Template
        </Button>
      </CardContent>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {formData.name ? 'Edit Template' : 'Create New Template'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Template Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            fullWidth
            multiline
            rows={3}
            margin="normal"
          />
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Sections
          </Typography>
          <List>
            {formData.sections.map((section, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={section.title}
                  secondary={
                    <>
                      Type: {section.type} | Source: {section.dataSource} | Viz: {section.visualization}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => removeSection(index)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Button variant="outlined" startIcon={<AddCircleIcon />} onClick={addSection}>
            Add Section
          </Button>

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Schedule
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Frequency</InputLabel>
            <Select
              value={formData.schedule.frequency}
              label="Frequency"
              onChange={(e) => setFormData(prev => ({
                ...prev,
                schedule: { ...prev.schedule, frequency: e.target.value as any }
              }))}
            >
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Format</InputLabel>
            <Select
              value={formData.schedule.format}
              label="Format"
              onChange={(e) => setFormData(prev => ({
                ...prev,
                schedule: { ...prev.schedule, format: e.target.value as any }
              }))}
            >
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="excel">Excel</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button onClick={saveTemplate} variant="contained" startIcon={<SaveIcon />} disabled={loading}>
            {loading ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ReportTemplateManager;