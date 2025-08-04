import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Stack, 
  Divider, 
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import { getQuotesForWorkOrder, approveQuote, rejectQuote } from '../../services/manager.api';

const QuoteList = ({ workOrderId }) => {
  const [quotes, setQuotes] = useState([]);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  const showToast = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const fetchQuotes = async () => {
    try {
      const response = await getQuotesForWorkOrder(workOrderId);
      setQuotes(response.data);
    } catch (error) {
      showToast('Error fetching quotes', 'error');
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [workOrderId]);

  const handleApprove = async (quoteId) => {
    try {
      await approveQuote(quoteId);
      showToast('Quote approved', 'success');
      fetchQuotes(); // Refresh the list
    } catch (error) {
      showToast('Error approving quote', 'error');
    }
  };

  const handleReject = async (quoteId) => {
    try {
      await rejectQuote(quoteId);
      showToast('Quote rejected', 'success');
      fetchQuotes(); // Refresh the list
    } catch (error) {
      showToast('Error rejecting quote', 'error');
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        Quotes
      </Typography>
      <Stack spacing={2} divider={<Divider />}>
        {quotes.map((quote) => (
          <Paper 
            key={quote.id} 
            sx={{ 
              p: 2, 
              opacity: quote.status !== 'PENDING' ? 0.5 : 1,
              border: 1,
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="bold">
                {quote.vendor.name}
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                ${quote.amount.toFixed(2)}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {quote.details}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                color="success" 
                size="small" 
                onClick={() => handleApprove(quote.id)} 
                disabled={quote.status !== 'PENDING'}
              >
                Approve
              </Button>
              <Button 
                variant="contained" 
                color="error" 
                size="small" 
                onClick={() => handleReject(quote.id)} 
                disabled={quote.status !== 'PENDING'}
              >
                Reject
              </Button>
            </Stack>
          </Paper>
        ))}
      </Stack>
      
      <Snackbar 
        open={toast.open} 
        autoHideDuration={3000} 
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QuoteList;