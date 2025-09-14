import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { dashboardService, ReportTemplate, AnalyticsFilters } from '../services/dashboardService';

interface ReportBuilderProps {
  onSave?: (template: ReportTemplate) => void;
  onPreview?: (template: ReportTemplate) => void;
  initialTemplate?: ReportTemplate;
}

const ReportBuilder: React.FC<ReportBuilderProps> = ({
  onSave,
  onPreview,
  initialTemplate,
}) => {
  const [template, setTemplate] = useState<Partial<ReportTemplate>>({
    name: '',
    type: 'custom',
    description: '',
    fields: [],
    filters: {},
    ...initialTemplate,
  });

  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableFields();
    if (initialTemplate) {
      setSelectedFields(initialTemplate.fields);
    }
  }, [initialTemplate]);

  const loadAvailableFields = async () => {
    // This would typically come from an API call
    const fields = [
      'propertyName',
      'propertyAddress',
      'unitNumber',
      'tenantName',
      'leaseStartDate',
      'leaseEndDate',
      'rentAmount',
      'paymentStatus',
      'maintenanceStatus',
      'occupancyRate',
      'revenue',
      'expenses',
      'netIncome',
    ];
    setAvailableFields(fields);
  };

  const handleFieldAdd = (field: string) => {
    if (!selectedFields.includes(field)) {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const handleFieldRemove = (field: string) => {
    setSelectedFields(selectedFields.filter(f => f !== field));
  };

  const handleFilterChange = (key: string, value: any) => {
    setTemplate(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    if (!template.name || selectedFields.length === 0) {
      return;
    }

    const completeTemplate: ReportTemplate = {
      id: template.id || `template-${Date.now()}`,
      name: template.name,
      type: template.type || 'custom',
      description: template.description || '',
      fields: selectedFields,
      filters: template.filters || {},
      createdBy: 'current-user', // This would come from auth context
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave?.(completeTemplate);
  };

  const handlePreview = () => {
    const previewTemplate: ReportTemplate = {
      id: 'preview',
      name: template.name || 'Preview Report',
      type: template.type || 'custom',
      description: template.description || '',
      fields: selectedFields,
      filters: template.filters || {},
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onPreview?.(previewTemplate);
    setPreviewOpen(true);
  };

  const formatFieldName = (field: string) => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Report Builder
      </Typography>

      <Grid container spacing={3}>
        {/* Report Configuration */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Report Configuration
            </Typography>

            <TextField
              fullWidth
              label="Report Name"
              value={template.name || ''}
              onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={template.type || 'custom'}
                label="Report Type"
                onChange={(e: SelectChangeEvent) =>
                  setTemplate(prev => ({ ...prev, type: e.target.value as ReportTemplate['type'] }))
                }
              >
                <MenuItem value="monthly-financial">Monthly Financial</MenuItem>
                <MenuItem value="occupancy">Occupancy Report</MenuItem>
                <MenuItem value="maintenance">Maintenance Summary</MenuItem>
                <MenuItem value="tenant">Tenant Report</MenuItem>
                <MenuItem value="custom">Custom Report</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={template.description || ''}
              onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
            />
          </Paper>
        </Grid>

        {/* Field Selection */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select Fields
            </Typography>

            <Grid container spacing={2}>
              {/* Available Fields */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Available Fields
                </Typography>
                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <List dense>
                    {availableFields
                      .filter(field => !selectedFields.includes(field))
                      .map(field => (
                        <ListItem key={field}>
                          <ListItemText primary={formatFieldName(field)} />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleFieldAdd(field)}
                            >
                              <AddIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                  </List>
                </Paper>
              </Grid>

              {/* Selected Fields */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Selected Fields ({selectedFields.length})
                </Typography>
                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <List dense>
                    {selectedFields.map(field => (
                      <ListItem key={field}>
                        <ListItemText primary={formatFieldName(field)} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleFieldRemove(field)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Filters */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Filters & Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Property ID"
                    value={template.filters?.propertyId || ''}
                    onChange={(e) => handleFilterChange('propertyId', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Date From"
                    type="date"
                    value={template.filters?.dateFrom || ''}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Date To"
                    type="date"
                    value={template.filters?.dateTo || ''}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={handlePreview}
              disabled={selectedFields.length === 0}
            >
              Preview
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!template.name || selectedFields.length === 0}
            >
              Save Template
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Report Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {template.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {template.description}
            </Typography>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Selected Fields:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedFields.map(field => (
                <Chip
                  key={field}
                  label={formatFieldName(field)}
                  variant="outlined"
                />
              ))}
            </Box>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Applied Filters:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(template.filters || {}).map(([key, value]) => (
                value && (
                  <Chip
                    key={key}
                    label={`${formatFieldName(key)}: ${value}`}
                    variant="outlined"
                    color="primary"
                  />
                )
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportBuilder;