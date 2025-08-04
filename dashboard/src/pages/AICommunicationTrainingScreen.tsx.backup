import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import AutomatedResponseSettings from '../components/communication-training/AutomatedResponseSettings';
import TemplateApprovalWorkflow from '../components/communication-training/TemplateApprovalWorkflow';
import {
  CommunicationTrainingState,
  ResponseSettings,
  CommunicationScenario,
  ToneStyleConfig,
  CommunicationTemplate,
  TemplateStatus
} from '../types/communication-training';

const AICommunicationTrainingScreen: React.FC = () => {
  const [state, setState] = useState<CommunicationTrainingState>({
    responseSettings: {
      triggers: ['after_hours', 'common_questions'],
      delayMinutes: 15,
      escalationRules: [],
      maxAttempts: 3,
      businessHoursOnly: false
    },
    scenarios: [],
    toneStyle: {
      tone: 'friendly',
      style: 'detailed',
      examples: {
        formal: {
          concise: 'Thank you for your inquiry. We will respond within 24 hours.',
          detailed: 'Thank you for contacting us regarding your inquiry. We have received your message and will provide a comprehensive response within 24 hours during our business hours.',
          empathetic: 'Thank you for reaching out to us. We understand your concern and will ensure you receive a thorough response within 24 hours.'
        },
        friendly: {
          concise: 'Hi! Thanks for reaching out. We\'ll get back to you soon!',
          detailed: 'Hi there! Thanks for your message. We\'ve received your inquiry and our team will get back to you with all the details you need within 24 hours.',
          empathetic: 'Hi! Thanks for contacting us. We really appreciate you reaching out and want to make sure we address your concerns properly. We\'ll get back to you soon!'
        },
        casual: {
          concise: 'Hey! Got your message, we\'ll be in touch.',
          detailed: 'Hey! We got your message and wanted to let you know we\'re on it. Expect to hear back from us with everything you need to know within the next day or so.',
          empathetic: 'Hey! Thanks for reaching out. We totally get where you\'re coming from and want to make sure we help you out properly. We\'ll be in touch soon!'
        }
      }
    },
    pendingTemplates: [
      // Mock data for demonstration
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
        status: 'pending' as TemplateStatus,
        createdBy: 'AI System',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        confidence: 0.79
      }
    ],
    isLoading: false
  });

  const handleResponseSettingsChange = (settings: ResponseSettings) => {
    setState(prev => ({
      ...prev,
      responseSettings: settings
    }));
  };

  const handleTemplateUpdate = (templateId: string, status: TemplateStatus, comments?: string) => {
    setState(prev => ({
      ...prev,
      pendingTemplates: prev.pendingTemplates.map(template =>
        template.id === templateId
          ? {
              ...template,
              status,
              reviewComments: comments,
              reviewedAt: new Date(),
              reviewedBy: 'Current User' // In real app, this would be the current user's name
            }
          : template
      )
    }));
  };

  // Simulate loading initial data
  useEffect(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API call
    setTimeout(() => {
      setState(prev => ({ ...prev, isLoading: false }));
    }, 1000);
  }, []);

  if (state.isLoading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box py={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI Communication Training
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Configure how the AI communicates with tenants and other contacts. Set up automated responses, 
          review scenarios, and customize the communication style.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <AutomatedResponseSettings
              settings={state.responseSettings}
              onSettingsChange={handleResponseSettingsChange}
              isLoading={state.isLoading}
            />
          </Grid>

          {/* Template Approval Workflow */}
          <Grid item xs={12}>
            <TemplateApprovalWorkflow
              pendingTemplates={state.pendingTemplates}
              onTemplateUpdate={handleTemplateUpdate}
              isLoading={state.isLoading}
            />
          </Grid>

          {/* Placeholder for other components */}
          <Grid item xs={12}>
            <Alert severity="info">
              Additional components (Scenario Review, Tone & Style Configuration) 
              will be implemented in the next subtasks.
            </Alert>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AICommunicationTrainingScreen;