/**
 * ReportPreview Component
 * Live preview of report configurations with real-time customization
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Slider,
  TextField,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Visibility as PreviewIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Lightbulb as InsightIcon,
  Assignment as ActionIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import {
  ReportTemplate,
  ReportCustomizationOptions,
  ReportVisualization,
  ReportSection,
  ReportFilter,
  ReportInsights,
  ReportRecommendations
} from '../types/reporting';

interface ReportPreviewProps {
  template: ReportTemplate;
  customizationOptions: ReportCustomizationOptions;
  onCustomizationChange: (options: ReportCustomizationOptions) => void;
  previewData?: {
    insights: ReportInsights[];
    recommendations: ReportRecommendations[];
    sampleData: any;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ReportPreview: React.FC<ReportPreviewProps> = ({
  template,
  customizationOptions,
  onCustomizationChange,
  previewData
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Generate sample data for preview
  const sampleData = useMemo(() => {
    if (previewData?.sampleData) return previewData.sampleData;

    return {
      portfolio: [
        { month: 'Jan', occupancy: 85, revenue: 125000, expenses: 45000 },
        { month: 'Feb', occupancy: 87, revenue: 132000, expenses: 48000 },
        { month: 'Mar', occupancy: 89, revenue: 138000, expenses: 52000 },
        { month: 'Apr', occupancy: 91, revenue: 145000, expenses: 49000 },
        { month: 'May', occupancy: 88, revenue: 142000, expenses: 51000 },
        { month: 'Jun', occupancy: 92, revenue: 148000, expenses: 53000 }
      ],
      propertyTypes: [
        { name: 'Residential', value: 65, count: 45 },
        { name: 'Commercial', value: 25, count: 18 },
        { name: 'Mixed-Use', value: 10, count: 7 }
      ],
      riskLevels: [
        { level: 'Low', count: 35, percentage: 50 },
        { level: 'Medium', count: 20, percentage: 29 },
        { level: 'High', count: 10, percentage: 14 },
        { level: 'Critical', count: 5, percentage: 7 }
      ]
    };
  }, [previewData]);

  const handleSectionToggle = (sectionId: string, isVisible: boolean) => {
    const updatedSections = customizationOptions.sections.map(section =>
      section.id === sectionId ? { ...section, isVisible } : section
    );

    onCustomizationChange({
      ...customizationOptions,
      sections: updatedSections
    });
  };

  const handleVisualizationToggle = (vizId: string, isVisible: boolean) => {
    const updatedVisualizations = customizationOptions.visualizations.map(viz =>
      viz.id === vizId ? { ...viz, config: { ...viz.config, showLegend: isVisible } } : viz
    );

    onCustomizationChange({
      ...customizationOptions,
      visualizations: updatedVisualizations
    });
  };

  const handleStylingChange = (property: string, value: any) => {
    onCustomizationChange({
      ...customizationOptions,
      styling: {
        ...customizationOptions.styling,
        [property]: value
      }
    });
  };

  const renderVisualization = (visualization: ReportVisualization) => {
    const { type, data, config } = visualization;

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data || sampleData.portfolio}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <RechartsTooltip />
              {config.showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#8884d8"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="occupancy"
                stroke="#82ca9d"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data || sampleData.portfolio}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <RechartsTooltip />
              {config.showLegend && <Legend />}
              <Bar dataKey="expenses" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data || sampleData.propertyTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sampleData.propertyTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Visualization type "{type}" not supported in preview
            </Typography>
          </Box>
        );
    }
  };

  const renderSection = (section: ReportSection) => {
    if (!section.isVisible) return null;

    return (
      <Card key={section.id} sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom>
            {section.title}
          </Typography>

          {section.type === 'chart' && section.content && (
            <Box sx={{ mt: 2 }}>
              {renderVisualization(section.content as ReportVisualization)}
            </Box>
          )}

          {section.type === 'insights' && previewData?.insights && (
            <Box>
              {previewData.insights.slice(0, 3).map((insight) => (
                <Box key={insight.id} sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <InsightIcon color="primary" />
                    <Typography variant="subtitle2">{insight.title}</Typography>
                    <Chip
                      label={insight.priority}
                      size="small"
                      color={insight.priority === 'high' ? 'error' : insight.priority === 'medium' ? 'warning' : 'default'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {insight.description}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    Confidence: {(insight.confidence * 100).toFixed(1)}% | Impact: {insight.impact}/10
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {section.type === 'recommendations' && previewData?.recommendations && (
            <Box>
              {previewData.recommendations.slice(0, 3).map((rec) => (
                <Box key={rec.id} sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ActionIcon color="secondary" />
                    <Typography variant="subtitle2">{rec.title}</Typography>
                    <Chip
                      label={`Priority: ${rec.priority}`}
                      size="small"
                      color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'default'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {rec.description}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    Effort: {rec.effort}/5 | Timeline: {rec.timeline}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {section.type === 'text' && (
            <Typography variant="body1">
              {section.content || 'Sample content for this section. This will be replaced with actual report data when generated.'}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderCustomizationPanel = () => (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Report Customization
      </Typography>

      {/* Sections Configuration */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Sections</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {customizationOptions.sections.map((section) => (
            <Box key={section.id} sx={{ mb: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={section.isVisible}
                    onChange={(e) => handleSectionToggle(section.id, e.target.checked)}
                    size="small"
                  />
                }
                label={section.title}
              />
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>

      {/* Visualizations Configuration */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Visualizations</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {customizationOptions.visualizations.map((viz) => (
            <Box key={viz.id} sx={{ mb: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={viz.config.showLegend !== false}
                    onChange={(e) => handleVisualizationToggle(viz.id, e.target.checked)}
                    size="small"
                  />
                }
                label={viz.title}
              />
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>

      {/* Styling Configuration */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Styling</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Primary Color"
                type="color"
                value={customizationOptions.styling.colors.primary}
                onChange={(e) => handleStylingChange('colors', {
                  ...customizationOptions.styling.colors,
                  primary: e.target.value
                })}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Theme"
                select
                value={customizationOptions.styling.theme}
                onChange={(e) => handleStylingChange('theme', e.target.value)}
                size="small"
              >
                <option value="default">Default</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="corporate">Corporate</option>
              </TextField>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
          size="small"
        >
          Reset
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => setIsEditing(false)}
          size="small"
        >
          Save Changes
        </Button>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Report Preview: {template.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={isEditing ? "Exit Edit Mode" : "Edit Report"}>
            <IconButton
              onClick={() => setIsEditing(!isEditing)}
              color={isEditing ? "primary" : "default"}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh Preview">
            <IconButton onClick={() => setLoading(true)}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Customization Panel */}
      {isEditing && renderCustomizationPanel()}

      {/* Report Preview */}
      <Paper sx={{ p: 3 }}>
        {/* Report Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {template.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {template.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={template.type} color="primary" size="small" />
            <Chip label={template.category} color="secondary" size="small" />
            <Chip label={`${template.sections.length} sections`} size="small" />
            <Chip label={`${template.dataSources.length} data sources`} size="small" />
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Report Content */}
        {customizationOptions.sections.map((section) => renderSection(section))}

        {/* Preview Data Notice */}
        {!previewData && (
          <Alert severity="info" sx={{ mt: 3 }}>
            This is a preview using sample data. The actual report will contain real data from your system.
          </Alert>
        )}

        {/* AI Insights Summary */}
        {previewData?.insights && previewData.insights.length > 0 && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <InsightIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI Insights Summary
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {previewData.insights.length} insights generated with {(previewData.confidence * 100).toFixed(1)}% confidence
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {previewData.insights.filter(i => i.priority === 'high').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      High Priority
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {previewData.insights.filter(i => i.priority === 'medium').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Medium Priority
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {previewData.insights.filter(i => i.priority === 'low').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Low Priority
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Paper>
    </Box>
  );
};

export default ReportPreview;