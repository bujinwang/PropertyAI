import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  DoneAll as DoneAllIcon,
  Assignment as AssignmentIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface UXBulkActionsProps {
  selectedReviews: string[];
  onBulkAction: (action: string, data: any) => Promise<void>;
  onSelectionChange: (selected: string[]) => void;
  availableAssignees: Array<{ id: string; name: string }>;
}

export const UXBulkActions: React.FC<UXBulkActionsProps> = ({
  selectedReviews,
  onBulkAction,
  onSelectionChange,
  availableAssignees,
}) => {
  const [bulkDialog, setBulkDialog] = useState<{
    open: boolean;
    type: 'status' | 'assign' | 'export' | 'delete' | null;
  }>({ open: false, type: null });
  const [bulkValue, setBulkValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });

  const handleBulkAction = async () => {
    setLoading(true);
    try {
      let data = {};
      
      switch (bulkDialog.type) {
        case 'status':
          data = { status: bulkValue };
          break;
        case 'assign':
          data = { assigneeId: bulkValue };
          break;
        case 'export':
          data = { format: bulkValue };
          break;
        case 'delete':
          data = { confirm: true };
          break;
      }

      await onBulkAction(bulkDialog.type!, data);
      
      setSnackbar({
        open: true,
        message: `Successfully ${bulkDialog.type}ed ${selectedReviews.length} reviews`,
        severity: 'success',
      });
      
      // Clear selection after successful action
      onSelectionChange([]);
      setBulkDialog({ open: false, type: null });
      setBulkValue('');
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to ${bulkDialog.type} reviews`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const openBulkDialog = (type: 'status' | 'assign' | 'export' | 'delete') => {
    setBulkDialog({ open: true, type });
    setBulkValue('');
  };

  const handleSelectAll = (allReviewIds: string[], checked: boolean) => {
    onSelectionChange(checked ? allReviewIds : []);
  };

  const handleSelectOne = (reviewId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedReviews, reviewId]);
    } else {
      onSelectionChange(selectedReviews.filter(id => id !== reviewId));
    }
  };

  const renderBulkDialog = () => {
    const { type } = bulkDialog;
    
    return (
      <Dialog open={bulkDialog.open} onClose={() => setBulkDialog({ open: false, type: null })}>
        <DialogTitle>
          {type === 'status' && 'Update Status for Multiple Reviews'}
          {type === 'assign' && 'Assign Multiple Reviews'}
          {type === 'export' && 'Export Selected Reviews'}
          {type === 'delete' && 'Delete Selected Reviews'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This action will affect {selectedReviews.length} selected reviews.
          </Typography>

          {type === 'status' && (
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                label="New Status"
              >
                <MenuItem value="OPEN">Open</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="RESOLVED">Resolved</MenuItem>
                <MenuItem value="CLOSED">Closed</MenuItem>
              </Select>
            </FormControl>
          )}

          {type === 'assign' && (
            <FormControl fullWidth>
              <InputLabel>Assign To</InputLabel>
              <Select
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                label="Assign To"
              >
                {availableAssignees.map(assignee => (
                  <MenuItem key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {type === 'export' && (
            <FormControl fullWidth>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                label="Export Format"
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="pdf">PDF Report</MenuItem>
              </Select>
            </FormControl>
          )}

          {type === 'delete' && (
            <Alert severity="warning">
              This will permanently delete {selectedReviews.length} reviews. This action cannot be undone.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialog({ open: false, type: null })} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkAction}
            disabled={loading || (type !== 'delete' && !bulkValue)}
            variant="contained"
            color={type === 'delete' ? 'error' : 'primary'}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      {selectedReviews.length > 0 && (
        <>
          <Chip
            label={`${selectedReviews.length} selected`}
            color="primary"
            variant="outlined"
            onDelete={() => onSelectionChange([])}
            deleteIcon={<CloseIcon />}
          />
          
          <Button
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={() => openBulkDialog('status')}
            variant="outlined"
          >
            Update Status
          </Button>
          
          <Button
            size="small"
            startIcon={<AssignmentIcon />}
            onClick={() => openBulkDialog('assign')}
            variant="outlined"
          >
            Assign
          </Button>
          
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => openBulkDialog('export')}
            variant="outlined"
          >
            Export
          </Button>
          
          <Button
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => openBulkDialog('delete')}
            variant="outlined"
            color="error"
          >
            Delete
          </Button>
        </>
      )}

      {renderBulkDialog()}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};