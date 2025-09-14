import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { LineChart, BarChart, PieChart, HeatMap } from './charts';
import { WidgetConfig, TrendData } from '../services/dashboardService';

interface WidgetGridProps {
  widgets: WidgetConfig[];
  onWidgetUpdate: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  onWidgetDelete: (widgetId: string) => void;
  onWidgetAdd: (widget: Omit<WidgetConfig, 'id'>) => void;
  data: { [key: string]: TrendData[] };
  loading?: boolean;
}

const WidgetGrid: React.FC<WidgetGridProps> = ({
  widgets,
  onWidgetUpdate,
  onWidgetDelete,
  onWidgetAdd,
  data,
  loading = false,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<WidgetConfig | null>(null);
  const [newWidget, setNewWidget] = useState<Partial<WidgetConfig>>({
    type: 'line-chart',
    title: '',
    position: { x: 0, y: 0, w: 6, h: 4 },
    dataSource: '',
    filters: {},
    settings: {},
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, widgetId: string) => {
    setMenuAnchor(event.currentTarget);
    setSelectedWidget(widgetId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedWidget(null);
  };

  const handleEditWidget = () => {
    const widget = widgets.find(w => w.id === selectedWidget);
    if (widget) {
      setEditingWidget(widget);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteWidget = () => {
    if (selectedWidget) {
      onWidgetDelete(selectedWidget);
    }
    handleMenuClose();
  };

  const handleSaveEdit = () => {
    if (editingWidget) {
      onWidgetUpdate(editingWidget.id, editingWidget);
      setEditDialogOpen(false);
      setEditingWidget(null);
    }
  };

  const handleSaveNew = () => {
    if (newWidget.title && newWidget.type) {
      onWidgetAdd(newWidget as Omit<WidgetConfig, 'id'>);
      setAddDialogOpen(false);
      setNewWidget({
        type: 'line-chart',
        title: '',
        position: { x: 0, y: 0, w: 6, h: 4 },
        dataSource: '',
        filters: {},
        settings: {},
      });
    }
  };

  const renderChart = (widget: WidgetConfig) => {
    const widgetData = data[widget.dataSource] || [];

    switch (widget.type) {
      case 'line-chart':
        return (
          <LineChart
            data={widgetData}
            title={widget.title}
            height={widget.position.h * 50}
            loading={loading}
          />
        );
      case 'bar-chart':
        return (
          <BarChart
            data={widgetData}
            title={widget.title}
            height={widget.position.h * 50}
            loading={loading}
          />
        );
      case 'pie-chart':
        return (
          <PieChart
            data={widgetData}
            title={widget.title}
            height={widget.position.h * 50}
            loading={loading}
          />
        );
      case 'heat-map':
        return (
          <HeatMap
            data={widgetData.map(d => ({
              x: d.label || d.date,
              y: 'Value',
              value: d.value,
            }))}
            title={widget.title}
            height={widget.position.h * 50}
            loading={loading}
          />
        );
      case 'kpi-card':
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" component="div">
              {widgetData[0]?.value || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {widget.title}
            </Typography>
          </Box>
        );
      default:
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Unsupported widget type: {widget.type}
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box>
      {/* Add Widget Button */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Widget
        </Button>
      </Box>

      {/* Widgets Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 2,
          minHeight: 400,
        }}
      >
        {widgets.map((widget) => (
          <Paper
            key={widget.id}
            sx={{
              gridColumn: `span ${widget.position.w}`,
              gridRow: `span ${widget.position.h}`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Widget Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                {widget.title}
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, widget.id)}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>

            {/* Widget Content */}
            <Box sx={{ height: 'calc(100% - 48px)', overflow: 'auto' }}>
              {renderChart(widget)}
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditWidget}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteWidget}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Edit Widget Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Widget</DialogTitle>
        <DialogContent>
          {editingWidget && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Title"
                value={editingWidget.title}
                onChange={(e) => setEditingWidget({ ...editingWidget, title: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Widget Type</InputLabel>
                <Select
                  value={editingWidget.type}
                  label="Widget Type"
                  onChange={(e: SelectChangeEvent) =>
                    setEditingWidget({
                      ...editingWidget,
                      type: e.target.value as WidgetConfig['type']
                    })
                  }
                >
                  <MenuItem value="line-chart">Line Chart</MenuItem>
                  <MenuItem value="bar-chart">Bar Chart</MenuItem>
                  <MenuItem value="pie-chart">Pie Chart</MenuItem>
                  <MenuItem value="heat-map">Heat Map</MenuItem>
                  <MenuItem value="kpi-card">KPI Card</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Data Source"
                value={editingWidget.dataSource}
                onChange={(e) => setEditingWidget({ ...editingWidget, dataSource: e.target.value })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Widget Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Widget</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={newWidget.title || ''}
              onChange={(e) => setNewWidget({ ...newWidget, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Widget Type</InputLabel>
              <Select
                value={newWidget.type || 'line-chart'}
                label="Widget Type"
                onChange={(e: SelectChangeEvent) =>
                  setNewWidget({ ...newWidget, type: e.target.value as WidgetConfig['type'] })
                }
              >
                <MenuItem value="line-chart">Line Chart</MenuItem>
                <MenuItem value="bar-chart">Bar Chart</MenuItem>
                <MenuItem value="pie-chart">Pie Chart</MenuItem>
                <MenuItem value="heat-map">Heat Map</MenuItem>
                <MenuItem value="kpi-card">KPI Card</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Data Source"
              value={newWidget.dataSource || ''}
              onChange={(e) => setNewWidget({ ...newWidget, dataSource: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveNew} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WidgetGrid;