import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Paper, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Grid, Card, CardContent, Chip } from '@mui/material';
import { Add, Delete, Edit, PlayArrow, Save, Settings } from '@mui/icons-material';
import { useDrop, useDrag, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { styled } from '@mui/material/styles';

// Types
interface WorkflowStep {
  id: string;
  type: 'task' | 'decision' | 'integration' | 'timer' | 'start' | 'end';
  name: string;
  config: any;
  position: { x: number; y: number };
  connections: string[];
}

interface WorkflowDefinition {
  id?: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
}

// Styled components
const Canvas = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '600px',
  backgroundColor: theme.palette.background.paper,
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  position: 'relative',
  overflow: 'hidden',
}));

const StepNode = styled(Paper)<{ selected?: boolean }>(({ theme, selected }) => ({
  position: 'absolute',
  minWidth: '120px',
  minHeight: '60px',
  padding: theme.spacing(1),
  cursor: 'move',
  border: selected ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const ConnectionLine = styled('svg')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  zIndex: 1,
});

// Step types configuration
const STEP_TYPES = {
  start: { label: 'Start', color: '#4caf50', icon: '▶️' },
  task: { label: 'Task', color: '#2196f3', icon: '⚙️' },
  decision: { label: 'Decision', color: '#ff9800', icon: '🔀' },
  integration: { label: 'Integration', color: '#9c27b0', icon: '🔗' },
  timer: { label: 'Timer', color: '#607d8b', icon: '⏰' },
  end: { label: 'End', color: '#f44336', icon: '⏹️' },
};

// Draggable step component
const DraggableStep: React.FC<{
  step: WorkflowStep;
  onSelect: (step: WorkflowStep) => void;
  onMove: (id: string, position: { x: number; y: number }) => void;
  selected: boolean;
}> = ({ step, onSelect, onMove, selected }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'step',
    item: { id: step.id, type: step.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const stepType = STEP_TYPES[step.type as keyof typeof STEP_TYPES];

  return (
    <StepNode
      ref={drag}
      selected={selected}
      onClick={() => onSelect(step)}
      style={{
        left: step.position.x,
        top: step.position.y,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <span style={{ fontSize: '16px' }}>{stepType.icon}</span>
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {step.name}
          </Typography>
          <Chip
            label={stepType.label}
            size="small"
            sx={{
              backgroundColor: stepType.color,
              color: 'white',
              fontSize: '10px',
              height: '16px'
            }}
          />
        </Box>
      </Box>
    </StepNode>
  );
};

// Step palette component
const StepPalette: React.FC<{
  onAddStep: (type: string, position: { x: number; y: number }) => void;
}> = ({ onAddStep }) => {
  const [, drop] = useDrop(() => ({
    accept: 'palette-item',
    drop: (item: { type: string }, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset) {
        onAddStep(item.type, { x: offset.x - 200, y: offset.y - 100 });
      }
    },
  }));

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Step Palette
      </Typography>
      <Grid container spacing={1}>
        {Object.entries(STEP_TYPES).map(([type, config]) => (
          <PaletteItem key={type} type={type} config={config} />
        ))}
      </Grid>
    </Paper>
  );
};

const PaletteItem: React.FC<{
  type: string;
  config: { label: string; color: string; icon: string };
}> = ({ type, config }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'palette-item',
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <Grid item xs={6} sm={4} md={3}>
      <Card
        ref={drag}
        sx={{
          cursor: 'grab',
          opacity: isDragging ? 0.5 : 1,
          border: `2px solid ${config.color}`,
          '&:hover': { boxShadow: 3 }
        }}
      >
        <CardContent sx={{ p: 1, textAlign: 'center' }}>
          <Typography variant="h6">{config.icon}</Typography>
          <Typography variant="caption">{config.label}</Typography>
        </CardContent>
      </Card>
    </Grid>
  );
};

// Step configuration dialog
const StepConfigDialog: React.FC<{
  open: boolean;
  step: WorkflowStep | null;
  onClose: () => void;
  onSave: (step: WorkflowStep) => void;
}> = ({ open, step, onClose, onSave }) => {
  const [editedStep, setEditedStep] = useState<WorkflowStep | null>(null);

  useEffect(() => {
    setEditedStep(step);
  }, [step]);

  const handleSave = () => {
    if (editedStep) {
      onSave(editedStep);
      onClose();
    }
  };

  if (!editedStep) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Configure Step</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Step Name"
          value={editedStep.name}
          onChange={(e) => setEditedStep({ ...editedStep, name: e.target.value })}
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Step Type</InputLabel>
          <Select
            value={editedStep.type}
            onChange={(e) => setEditedStep({ ...editedStep, type: e.target.value })}
          >
            {Object.entries(STEP_TYPES).map(([type, config]) => (
              <MenuItem key={type} value={type}>
                {config.icon} {config.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {/* Additional configuration fields based on step type */}
        {editedStep.type === 'task' && (
          <TextField
            fullWidth
            label="Task Description"
            multiline
            rows={3}
            value={editedStep.config?.description || ''}
            onChange={(e) => setEditedStep({
              ...editedStep,
              config: { ...editedStep.config, description: e.target.value }
            })}
            margin="normal"
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

// Main WorkflowDesigner component
const WorkflowDesigner: React.FC<{
  workflow?: WorkflowDefinition;
  onSave?: (workflow: WorkflowDefinition) => void;
  onExecute?: (workflow: WorkflowDefinition) => void;
}> = ({ workflow, onSave, onExecute }) => {
  const [steps, setSteps] = useState<WorkflowStep[]>(workflow?.steps || []);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState(workflow?.name || '');
  const [workflowDescription, setWorkflowDescription] = useState(workflow?.description || '');
  const [workflowCategory, setWorkflowCategory] = useState(workflow?.category || '');

  const canvasRef = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop(() => ({
    accept: 'step',
    drop: (item: { id: string }, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset && canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const newPosition = {
          x: offset.x - canvasRect.left,
          y: offset.y - canvasRect.top,
        };
        handleMoveStep(item.id, newPosition);
      }
    },
  }));

  const handleAddStep = useCallback((type: string, position: { x: number; y: number }) => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      type: type as any,
      name: `${STEP_TYPES[type as keyof typeof STEP_TYPES].label} ${steps.length + 1}`,
      config: {},
      position,
      connections: [],
    };
    setSteps(prev => [...prev, newStep]);
  }, [steps.length]);

  const handleMoveStep = useCallback((id: string, position: { x: number; y: number }) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === id ? { ...step, position } : step
      )
    );
  }, []);

  const handleSelectStep = useCallback((step: WorkflowStep) => {
    setSelectedStep(step);
    setConfigDialogOpen(true);
  }, []);

  const handleSaveStep = useCallback((updatedStep: WorkflowStep) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === updatedStep.id ? updatedStep : step
      )
    );
  }, []);

  const handleDeleteStep = useCallback(() => {
    if (selectedStep) {
      setSteps(prev => prev.filter(step => step.id !== selectedStep.id));
      setSelectedStep(null);
      setConfigDialogOpen(false);
    }
  }, [selectedStep]);

  const handleSaveWorkflow = useCallback(() => {
    const workflowDef: WorkflowDefinition = {
      id: workflow?.id,
      name: workflowName,
      description: workflowDescription,
      category: workflowCategory,
      steps,
    };

    onSave?.(workflowDef);
  }, [workflow?.id, workflowName, workflowDescription, workflowCategory, steps, onSave]);

  const handleExecuteWorkflow = useCallback(() => {
    const workflowDef: WorkflowDefinition = {
      id: workflow?.id,
      name: workflowName,
      description: workflowDescription,
      category: workflowCategory,
      steps,
    };

    onExecute?.(workflowDef);
  }, [workflow?.id, workflowName, workflowDescription, workflowCategory, steps, onExecute]);

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ p: 3 }}>
        {/* Workflow Header */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Workflow Name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Category"
                value={workflowCategory}
                onChange={(e) => setWorkflowCategory(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveWorkflow}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PlayArrow />}
                  onClick={handleExecuteWorkflow}
                >
                  Execute
                </Button>
              </Box>
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={2}
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            sx={{ mt: 2 }}
          />
        </Paper>

        {/* Step Palette */}
        <StepPalette onAddStep={handleAddStep} />

        {/* Canvas */}
        <Canvas ref={drop} sx={{ mb: 2 }}>
          <ConnectionLine>
            {/* Connection lines would be rendered here */}
          </ConnectionLine>
          {steps.map(step => (
            <DraggableStep
              key={step.id}
              step={step}
              onSelect={handleSelectStep}
              onMove={handleMoveStep}
              selected={selectedStep?.id === step.id}
            />
          ))}
        </Canvas>

        {/* Step Configuration Dialog */}
        <StepConfigDialog
          open={configDialogOpen}
          step={selectedStep}
          onClose={() => setConfigDialogOpen(false)}
          onSave={handleSaveStep}
        />

        {/* Action Buttons */}
        {selectedStep && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setConfigDialogOpen(true)}
            >
              Configure
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleDeleteStep}
            >
              Delete
            </Button>
          </Box>
        )}
      </Box>
    </DndProvider>
  );
};

export default WorkflowDesigner;