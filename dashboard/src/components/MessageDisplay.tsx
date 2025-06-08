import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

interface MessageDisplayProps {
  messages: Message[];
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ messages }) => {
  return (
    <Box>
      {messages.map(msg => (
        <Box key={msg.id} my={1} sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
          <Paper elevation={3} sx={{ p: 2, maxWidth: '70%' }}>
            <Typography variant="body1">{msg.text}</Typography>
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

export default MessageDisplay;
