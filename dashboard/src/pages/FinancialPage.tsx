import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import PaymentApproval from '../../components/financial/PaymentApproval';

const FinancialPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Financial Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and approve pending payments for your properties
        </Typography>
      </Box>
      <PaymentApproval />
    </Container>
  );
};

export default FinancialPage;
