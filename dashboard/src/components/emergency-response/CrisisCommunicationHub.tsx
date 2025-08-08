import React from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, List, ListItem, ListItemText } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';

const CrisisCommunicationHub: React.FC = () => {
  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Crisis Communication Hub
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Send urgent notifications to tenants, staff, and emergency contacts
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="Message Subject"
              variant="outlined"
              margin="normal"
              placeholder="Enter urgent message subject..."
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Message Content"
              variant="outlined"
              margin="normal"
              placeholder="Enter your urgent message..."
            />
            
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<SendIcon />}
              >
                Send Emergency Alert
              </Button>
              <Button
                variant="outlined"
                startIcon={<PhoneIcon />}
              >
                Call Emergency Services
              </Button>
            </Box>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Recent Communications
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Fire Safety Drill Reminder"
                  secondary="Sent to all tenants - 2 hours ago"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Water Outage Notice"
                  secondary="Sent to Building A tenants - 1 day ago"
                />
              </ListItem>
            </List>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CrisisCommunicationHub;