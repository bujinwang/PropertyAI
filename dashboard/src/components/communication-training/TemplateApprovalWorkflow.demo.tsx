import React from 'react';
import { Box, Typography } from '@mui/material';
import TemplateApprovalWorkflow from './TemplateApprovalWorkflow';
import { CommunicationTemplate, TemplateStatus } from '../../types/communication-training';

const mockTemplates: CommunicationTemplate[] = [
  {
    id: '1',
    title: 'After Hours Maintenance Request Response',
    content: 'Thank you for submitting your maintenance request. We have received your request and will have our maintenance team contact you first thing tomorrow morning to schedule a convenient time for the repair. For emergency maintenance issues, please call our 24/7 emergency line at (555) 123-4567.',
    category: 'Maintenance',
    trigger: 'after_hours',
    status: 'pending' as TemplateStatus,
    createdBy: 'AI System',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    confidence: 0.87
  },
  {
    id: '2',
    title: 'Payment Inquiry Auto-Response',
    content: 'Hi there! Thanks for reaching out about your payment. Your rent payment is due on the 1st of each month. You can pay online through our tenant portal, by phone at (555) 987-6543, or by dropping off a check at our office. If you have any questions about your account balance or payment history, please let us know!',
    category: 'Payment',
    trigger: 'payment_inquiries',
    status: 'pending' as TemplateStatus,
    createdBy: 'AI System',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    confidence: 0.92
  },
  {
    id: '3',
    title: 'Lease Question Standard Response',
    content: 'Thank you for your lease-related inquiry. We want to ensure you have all the information you need about your lease agreement. Our leasing team will review your question and provide you with a detailed response within 24 hours. For urgent lease matters, please contact our office directly at (555) 456-7890.',
    category: 'Leasing',
    trigger: 'lease_questions',
    status: 'approved' as TemplateStatus,
    createdBy: 'AI System',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    reviewedBy: 'John Manager',
    reviewedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    reviewComments: 'Approved - looks professional and helpful',
    confidence: 0.79
  },
  {
    id: '4',
    title: 'Emergency Response Template',
    content: 'We have received your emergency maintenance request. Our emergency response team has been notified and will contact you within 15 minutes. If this is a life-threatening emergency, please call 911 immediately.',
    category: 'Emergency',
    trigger: 'emergency_situations',
    status: 'rejected' as TemplateStatus,
    createdBy: 'AI System',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    reviewedBy: 'Sarah Admin',
    reviewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    reviewComments: 'Template needs to be more specific about what constitutes an emergency',
    confidence: 0.65
  }
];

const TemplateApprovalWorkflowDemo: React.FC = () => {
  const handleTemplateUpdate = (templateId: string, status: TemplateStatus, comments?: string) => {
    console.log('Template update:', { templateId, status, comments });
    alert(`Template ${templateId} ${status}${comments ? ` with comments: ${comments}` : ''}`);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Template Approval Workflow Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        This demo shows the template approval workflow component with sample data.
        Note: You need to have an approver role (admin, manager, or approver) to see the component.
      </Typography>
      
      <TemplateApprovalWorkflow
        pendingTemplates={mockTemplates}
        onTemplateUpdate={handleTemplateUpdate}
        isLoading={false}
      />
    </Box>
  );
};

export default TemplateApprovalWorkflowDemo;