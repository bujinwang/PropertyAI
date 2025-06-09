import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import { Message } from '../types/types';

interface MessageDisplayProps {
  messages: Message[];
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ messages }) => {
  const getSentimentColor = (sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL') => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'lightgreen';
      case 'NEGATIVE':
        return 'lightcoral';
      case 'NEUTRAL':
        return 'lightgray';
      default:
        return 'white';
    }
  };

  const getSentimentIcon = (sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL') => {
    switch (sentiment) {
      case 'POSITIVE':
        return <SentimentSatisfiedAltIcon sx={{ color: 'green' }} />;
      case 'NEGATIVE':
        return <SentimentVeryDissatisfiedIcon sx={{ color: 'red' }} />;
      case 'NEUTRAL':
        return <SentimentNeutralIcon sx={{ color: 'gray' }} />;
      default:
        return null;
    }
  };

  return (
    <Box>
      {messages.map(msg => (
        <Box key={msg.id} my={1} sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', alignItems: 'center' }}>
          <Paper elevation={3} sx={{ p: 2, maxWidth: '70%', backgroundColor: getSentimentColor(msg.sentiment), display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ flexGrow: 1 }}>{msg.text}</Typography>
            {getSentimentIcon(msg.sentiment)}
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

export default MessageDisplay;
