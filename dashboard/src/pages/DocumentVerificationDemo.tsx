import React from 'react';
import {
  Container,
  Typography,
  Box,
  Alert
} from '@mui/material';
import DocumentVerificationStatusScreen from './DocumentVerificationStatusScreen';

const DocumentVerificationDemo: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Document Verification Status Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This demo showcases the enhanced Document Verification Status Screen with:
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Features demonstrated:</strong>
            <br />• Stepper component showing verification stages with current status highlighting
            <br />• Estimated completion time display with progress indicators
            <br />• Detailed status information panel with AI-generated content indicators
            <br />• Required actions display with enhanced priority indicators
            <br />• Confidence score visualization for verification results
            <br />• Material-UI components with proper styling throughout
          </Typography>
        </Alert>
      </Box>

      <DocumentVerificationStatusScreen />
    </Container>
  );
};

export default DocumentVerificationDemo;