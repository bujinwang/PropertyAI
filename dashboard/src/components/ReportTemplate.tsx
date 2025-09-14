import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  FileCopy as DuplicateIcon,
} from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { dashboardService, ReportTemplate as ReportTemplateType } from '../services/dashboardService';

interface ReportTemplateProps {
  templates: ReportTemplateType[];
  onTemplateSelect?: (template: ReportTemplateType) => void;
  onTemplateEdit?: (template: ReportTemplateType) => void;
  onTemplateDelete?: (templateId: string) => void;
  onTemplateDuplicate?: (template: ReportTemplateType) => void;
  onTemplateRun?: (template: ReportTemplateType) => void;
}

const ReportTemplate: React.FC<ReportTemplateProps> = ({
  templates,
  onTemplateSelect,
  onTemplateEdit,
  onTemplateDelete,
  onTemplateDuplicate,
  onTemplateRun,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplateType | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = templates.filter(template => {
    const matchesType = filterType === 'all' || template.type === filterType;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleTemplateClick = (template: ReportTemplateType) => {
    setSelectedTemplate(template);
    onTemplateSelect?.(template);
  };

  const handleEdit = (template: ReportTemplateType) => {
    onTemplateEdit?.(template);
  };

  const handleDelete = (templateId: string) => {
    onTemplateDelete?.(templateId);
  };

  const handleDuplicate = (template: ReportTemplateType) => {
    onTemplateDuplicate?.(template);
  };

  const handleRun = (template: ReportTemplateType) => {
    onTemplateRun?.(template);
  };

  const formatFieldName = (field: string) => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'monthly-financial':
        return 'primary';
      case 'occupancy':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'tenant':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'monthly-financial':
        return 'Financial';
      case 'occupancy':
        return 'Occupancy';
      case 'maintenance':
        return 'Maintenance';
      case 'tenant':
        return 'Tenant';
      default:
        return 'Custom';
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Report Templates
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Search templates"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filterType}
              label="Type"
              onChange={(e: SelectChangeEvent) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="monthly-financial">Financial</MenuItem>
              <MenuItem value="occupancy">Occupancy</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="tenant">Tenant</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Templates Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
            }}
            onClick={() => handleTemplateClick(template)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                  {template.name}
                </Typography>
                <Chip
                  label={getTypeLabel(template.type)}
                  color={getTypeColor(template.type) as any}
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {template.description}
              </Typography>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Fields ({template.fields.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {template.fields.slice(0, 3).map((field) => (
                  <Chip
                    key={field}
                    label={formatFieldName(field)}
                    size="small"
                    variant="outlined"
                  />
                ))}
                {template.fields.length > 3 && (
                  <Chip
                    label={`+${template.fields.length - 3} more`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>

              <Typography variant="caption" color="text.secondary">
                Created: {new Date(template.createdAt).toLocaleDateString()}
              </Typography>
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between' }}>
              <Box>
                <Tooltip title="Run Report">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRun(template);
                    }}
                  >
                    <RunIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Duplicate">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(template);
                    }}
                  >
                    <DuplicateIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(template);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardActions>
          </Card>
        ))}
      </Box>

      {filteredTemplates.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No templates found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first report template'
            }
          </Typography>
        </Box>
      )}

      {/* Template Details Dialog */}
      {selectedTemplate && (
        <Dialog
          open={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{selectedTemplate.name}</DialogTitle>
          <DialogContent>
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedTemplate.description}
              </Typography>

              <Typography variant="h6" sx={{ mb: 1 }}>
                Report Type
              </Typography>
              <Chip
                label={getTypeLabel(selectedTemplate.type)}
                color={getTypeColor(selectedTemplate.type) as any}
                sx={{ mb: 2 }}
              />

              <Typography variant="h6" sx={{ mb: 1 }}>
                Selected Fields
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {selectedTemplate.fields.map((field) => (
                  <Chip
                    key={field}
                    label={formatFieldName(field)}
                    variant="outlined"
                  />
                ))}
              </Box>

              <Typography variant="h6" sx={{ mb: 1 }}>
                Applied Filters
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(selectedTemplate.filters).map(([key, value]) => (
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
            <Button onClick={() => setSelectedTemplate(null)}>Close</Button>
            <Button
              variant="contained"
              onClick={() => handleRun(selectedTemplate)}
            >
              Run Report
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default ReportTemplate;