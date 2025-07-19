import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Alert,
  Divider,
  Stack
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Schedule as PendingIcon
} from '@mui/icons-material';
import { CommunicationTemplate, TemplateStatus } from '../../types/communication-training';
import { useAuth } from '../../contexts/AuthContext';
import TemplateReviewModal from './TemplateReviewModal';

interface TemplateApprovalWorkflowProps {
  pendingTemplates: CommunicationTemplate[];
  onTemplateUpdate: (templateId: string, status: TemplateStatus, comments?: string) => void;
  isLoading?: boolean;
}

const TemplateApprovalWorkflow: React.FC<TemplateApprovalWorkflowProps> = ({
  pendingTemplates,
  onTemplateUpdate,
  isLoading = false
}) => {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Check if user has approver role
  const hasApproverRole = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'approver';

  // Don't render if user doesn't have approver role
  if (!hasApproverRole) {
    return null;
  }

  const handleViewTemplate = (template: CommunicationTemplate) => {
    setSelectedTemplate(template);
    setReviewModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
    setReviewModalOpen(false);
  };

  const handleTemplateAction = (templateId: string, status: TemplateStatus, comments?: string) => {
    onTemplateUpdate(templateId, status, comments);
    handleCloseModal();
  };

  const getStatusColor = (status: TemplateStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: TemplateStatus): React.ReactElement | undefined => {
    switch (status) {
      case 'approved':
        return <ApproveIcon fontSize="small" />;
      case 'rejected':
        return <RejectIcon fontSize="small" />;
      case 'pending':
        return <PendingIcon fontSize="small" />;
      default:
        return undefined;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const pendingCount = pendingTemplates.filter(t => t.status === 'pending').length;

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="h3">
            Template Approval Queue
          </Typography>
          <Badge badgeContent={pendingCount} color="warning">
            <Chip
              icon={<PendingIcon />}
              label={`${pendingCount} Pending`}
              color="warning"
              variant="outlined"
            />
          </Badge>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          Review and approve AI-generated communication templates before they become available for use.
        </Typography>

        {pendingTemplates.length === 0 ? (
          <Alert severity="info">
            No templates pending approval at this time.
          </Alert>
        ) : (
          <List>
            {pendingTemplates.map((template, index) => (
              <React.Fragment key={template.id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" component="span">
                          {template.title}
                        </Typography>
                        <Chip
                          icon={getStatusIcon(template.status)}
                          label={template.status.charAt(0).toUpperCase() + template.status.slice(1)}
                          color={getStatusColor(template.status)}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Stack spacing={1} mt={1}>
                        <Typography variant="body2" color="text.secondary">
                          Category: {template.category} • Trigger: {template.trigger.replace('_', ' ')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Created by {template.createdBy} on {formatDate(template.createdAt)}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {template.content}
                        </Typography>
                      </Stack>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        edge="end"
                        onClick={() => handleViewTemplate(template)}
                        color="primary"
                        disabled={isLoading}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < pendingTemplates.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Template Review Modal */}
        {selectedTemplate && (
          <TemplateReviewModal
            open={reviewModalOpen}
            template={selectedTemplate}
            onClose={handleCloseModal}
            onApprove={(comments) => handleTemplateAction(selectedTemplate.id, 'approved', comments)}
            onReject={(comments) => handleTemplateAction(selectedTemplate.id, 'rejected', comments)}
            isLoading={isLoading}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TemplateApprovalWorkflow;