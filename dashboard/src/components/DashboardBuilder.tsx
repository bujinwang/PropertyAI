import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  Assessment as KPIIcon,
  TrendingUp as PredictionIcon,
} from '@mui/icons-material';
import { WidgetConfig } from '../services/dashboardService';

interface DashboardBuilderProps {
  widgets: WidgetConfig[];
  onSave: (widgets: WidgetConfig[]) => void;
  onCancel: () => void;
  availableWidgets: Array<{
    type: string;
    title: string;
    icon: React.ReactNode;
    defaultConfig: Partial<WidgetConfig>;
  }>;
}

const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  widgets: initialWidgets,
  onSave,
  onCancel,
  availableWidgets,
}) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initialWidgets);
  const [selectedWidget, setSelectedWidget] = useState<WidgetConfig | null>(null);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<WidgetConfig | null>(null);

  const handleAddWidget = useCallback((widgetType: string) => {
    const template = availableWidgets.find(w => w.type === widgetType);
    if (!template) return;

    const newWidget: WidgetConfig = {
      id: `widget-${Date.now()}`,
      type: widgetType as any,
      title: template.title,
      position: { x: 0, y: 0, w: 6, h: 4 },
      dataSource: '',
      filters: {},
      settings: {},
      ...template.defaultConfig,
    };

    setWidgets(prev => [...prev, newWidget]);
    setShowWidgetLibrary(false);
  }, [availableWidgets]);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    if (selectedWidget?.id === widgetId) {
      setSelectedWidget(null);
    }
  }, [selectedWidget]);

  const handleUpdateWidget = useCallback((updatedWidget: WidgetConfig) => {
    setWidgets(prev => prev.map(w => w.id === updatedWidget.id ? updatedWidget : w));
    setSelectedWidget(updatedWidget);
  }, []);

  const handleDragStart = useCallback((widget: WidgetConfig) => {
    setDraggedWidget(widget);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null);
  }, []);

  const handleSave = useCallback(() => {
    onSave(widgets);
  }, [widgets, onSave]);

  const renderWidget = (widget: WidgetConfig) => (
    <Card
      key={widget.id}
      sx={{
        height: widget.position.h * 60,
        cursor: draggedWidget?.id === widget.id ? 'grabbing' : 'grab',
        border: selectedWidget?.id === widget.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
        '&:hover': {
          boxShadow: 3,
        },
      }}
      onClick={() => setSelectedWidget(widget)}
    >
      <CardContent sx={{ height: '100%', p: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DragIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="subtitle2">{widget.title}</Typography>
          </Box>
          <Box>
            <Tooltip title="Configure">
              <IconButton size="small" onClick={(e) => {
                e.stopPropagation();
                setSelectedWidget(widget);
              }}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove">
              <IconButton size="small" onClick={(e) => {
                e.stopPropagation();
                handleRemoveWidget(widget.id);
              }}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {widget.type.replace('-', ' ').toUpperCase()} Widget
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Dashboard Builder</Typography>
          <ButtonGroup variant="outlined" size="small">
            <Button onClick={onCancel}>Cancel</Button>
            <Button onClick={handleSave} startIcon={<SaveIcon />}>
              Save Dashboard
            </Button>
          </ButtonGroup>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex' }}>
        {/* Dashboard Canvas */}
        <Box sx={{ flex: 1, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Dashboard Layout</Typography>

          <Grid container spacing={2}>
            {widgets.map(widget => (
              <Grid
                key={widget.id}
                item
                xs={12}
                sm={widget.position.w >= 6 ? 12 : 6}
                md={widget.position.w >= 6 ? 12 : widget.position.w >= 4 ? 6 : 4}
                lg={widget.position.w >= 6 ? 12 : widget.position.w >= 4 ? 6 : widget.position.w >= 3 ? 4 : widget.position.w}
              >
                {renderWidget(widget)}
              </Grid>
            ))}

            {/* Add Widget Placeholder */}
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <Card
                sx={{
                  height: 240,
                  border: '2px dashed #1976d2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
                onClick={() => setShowWidgetLibrary(true)}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <AddIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" color="primary">
                    Add Widget
                  </Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Widget Configuration Panel */}
        {selectedWidget && (
          <Paper sx={{ width: 300, p: 2, ml: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Configure Widget
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Title
              </Typography>
              <input
                type="text"
                value={selectedWidget.title}
                onChange={(e) => handleUpdateWidget({
                  ...selectedWidget,
                  title: e.target.value
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Data Source
              </Typography>
              <input
                type="text"
                value={selectedWidget.dataSource}
                onChange={(e) => handleUpdateWidget({
                  ...selectedWidget,
                  dataSource: e.target.value
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </Box>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => setSelectedWidget(null)}
            >
              Close Configuration
            </Button>
          </Paper>
        )}
      </Box>

      {/* Widget Library Dialog */}
      <Dialog
        open={showWidgetLibrary}
        onClose={() => setShowWidgetLibrary(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Widget</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Choose a widget type to add to your dashboard:
          </Typography>

          <Grid container spacing={2}>
            {availableWidgets.map(widget => (
              <Grid item xs={6} key={widget.type}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => handleAddWidget(widget.type)}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    {widget.icon}
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {widget.title}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWidgetLibrary(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setShowWidgetLibrary(true)}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default DashboardBuilder;