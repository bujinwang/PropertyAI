import React from 'react';
import { Box, Paper, Typography, TextField, Button } from '@mui/material';

const DigitalConciergeScreen: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Digital Concierge
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">How can I help you today?</Typography>
        <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Ask me anything..."
            variant="outlined"
          />
          <Button variant="contained" sx={{ mt: 1 }}>
            Send
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default DigitalConciergeScreen;
