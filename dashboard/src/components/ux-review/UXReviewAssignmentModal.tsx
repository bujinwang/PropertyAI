import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface UXReview {
  id: string;
  title: string;
  description?: string;
  componentId: string;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  severity: string;
  priority: string;
}

interface UXReviewAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  review: UXReview | null;
  onAssign: (assignmentData: any) => void;
}

const mockUsers = [
  { id: '1', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', role: 'UX Designer' },
  { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', role: 'Frontend Developer' },
  { id: '3', firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@example.com', role: 'QA Engineer' },
  { id: '4', firstName: 'Sarah', lastName: 'Williams', email: 'sarah.williams@example.com', role: 'Product Manager' },
];

export const UXReviewAssignmentModal: React.FC<UXReviewAssignmentModalProps> = ({
  open,
  onClose,
  review,
  onAssign,
}) => {
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!review) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!assigneeId) {
      newErrors.assigneeId = 'Please select an assignee';
    }
    
    if (!dueDate) {
      newErrors.dueDate = 'Please select a due date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onAssign({
        reviewId: review.id,
        assigneeId,
        dueDate,
        notes,
      });
      
      // Reset form
      setAssigneeId('');
      setDueDate(null);
      setNotes('');
      setErrors({});
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form on close
    setAssigneeId('');
    setDueDate(null);
    setNotes('');
    setErrors({});
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'Urgent - Address within 24 hours';
      case 'HIGH': return 'High - Address within 3 days';
      case 'MEDIUM': return 'Medium - Address within 1 week';
      case 'LOW': return 'Low - Address within 2 weeks';
      default: return 'No specific timeline';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'Critical - System breaking issue';
      case 'HIGH': return 'High - Significant user impact';
      case 'MEDIUM': return 'Medium - Moderate user impact';
      case 'LOW': return 'Low - Minor user impact';
      default: return 'No severity specified';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Review
        </DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Review Summary */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Review: {review.title}
              </Typography>
              <Typography variant="body2">
                Severity: {getSeverityLabel(review.severity)}
              </Typography>
              <Typography variant="body2">
                Priority: {getPriorityLabel(review.priority)}
              </Typography>
            </Alert>

            {/* Assignee Selection */}
            <Box mb={3}>
              <FormControl fullWidth error={!!errors.assigneeId}>
                <InputLabel>Assign To *</InputLabel>
                <Select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  label="Assign To *"
                >
                  <MenuItem value="">
                    <em>Select a team member</em>
                  </MenuItem>
                  {mockUsers.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.role})
                    </MenuItem>
                  ))}
                </Select>
                {errors.assigneeId && (
                  <Typography variant="caption" color="error">{errors.assigneeId}</Typography>
                )}
              </FormControl>
            </Box>

            {/* Due Date */}
            <Box mb={3}>
              <FormControl fullWidth error={!!errors.dueDate}>
                <DatePicker
                  label="Due Date *"
                  value={dueDate}
                  onChange={(date) => setDueDate(date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.dueDate,
                      helperText: errors.dueDate,
                    },
                  }}
                />
              </FormControl>
            </Box>

            {/* Notes */}
            <Box mb={2}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Assignment Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any specific instructions or context..."
                variant="outlined"
              />
            </Box>

            {/* Assignment Preview */}
            {assigneeId && dueDate && (
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Assignment Preview
                </Typography>
                <Typography variant="body2">
                  <strong>Review:</strong> {review.title}
                </Typography>
                <Typography variant="body2">
                  <strong>Assigned to:</strong> {mockUsers.find(u => u.id === assigneeId)?.firstName} {mockUsers.find(u => u.id === assigneeId)?.lastName}
                </Typography>
                <Typography variant="body2">
                  <strong>Due date:</strong> {dueDate.toLocaleDateString()}
                </Typography>
                {notes && (
                  <Typography variant="body2">
                    <strong>Notes:</strong> {notes}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            variant="contained"
            disabled={!assigneeId || !dueDate}
          >
            Assign Review
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};