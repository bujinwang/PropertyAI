import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Email as EmailIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import MessageInbox from '../components/MessageInbox';
import MessageThread from '../components/MessageThread';
import MessageCompose from '../components/MessageCompose';

const Messages: React.FC = () => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  const handleComposeSuccess = () => {
    // Refresh the inbox when a message is sent
    setSelectedThreadId(null);
  };

  const handleBackToInbox = () => {
    setSelectedThreadId(null);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EmailIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Messages
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Communicate with tenants and manage conversations
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setComposeOpen(true)}
          sx={{ minWidth: 140 }}
        >
          Compose
        </Button>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {isMobile ? (
          // Mobile Layout: Show one view at a time
          <Box sx={{ height: '100%' }}>
            {!selectedThreadId ? (
              <MessageInbox onThreadSelect={handleThreadSelect} />
            ) : (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Button onClick={handleBackToInbox} variant="outlined" size="small">
                    ← Back to Inbox
                  </Button>
                </Box>
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <MessageThread threadId={selectedThreadId} />
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          // Desktop Layout: Side-by-side
          <Box sx={{ display: 'flex', gap: 3, height: '100%' }}>
            <Box sx={{ flex: '0 0 35%', minWidth: 300 }}>
              <MessageInbox
                onThreadSelect={handleThreadSelect}
                selectedThreadId={selectedThreadId || undefined}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              {selectedThreadId ? (
                <MessageThread threadId={selectedThreadId} />
              ) : (
                <Paper
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <EmailIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a conversation to view
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose a conversation from the inbox to read messages
                  </Typography>
                </Paper>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* Compose Dialog */}
      <MessageCompose
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSuccess={handleComposeSuccess}
      />
    </Box>
  );
};

export default Messages;