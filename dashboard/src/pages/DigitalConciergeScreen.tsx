import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  IconButton,
  Fade,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
// Change from:
// To:
import aiService from '../services/aiService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  context?: string;
}

const DigitalConciergeScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your property management AI assistant. How can I help you today?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await aiService.getAIResponse({
        query: inputText,
        context,
        type: 'concierge',
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'ai',
        timestamp: new Date(),
        context: response.context,
      };

      setMessages((prev) => [...prev, aiMessage]);
      if (response.context) {
        setContext(response.context);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I\'m sorry, I encountered an error processing your request. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { label: 'Maintenance Request', action: 'help me submit a maintenance request' },
    { label: 'Pay Rent', action: 'how do I pay my rent' },
    { label: 'Lease Info', action: 'tell me about my lease' },
    { label: 'Contact Manager', action: 'how can I contact property management' },
  ];

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
        Digital Concierge
      </Typography>
      
      <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
          <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
            <List>
              {messages.map((message) => (
                <Fade key={message.id} in={true} timeout={500}>
                  <ListItem
                    sx={{
                      flexDirection: 'column',
                      alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: message.sender === 'ai' ? 'primary.main' : 'secondary.main' }}>
                        {message.sender === 'ai' ? <SmartToyIcon /> : <PersonIcon />}
                      </Avatar>
                      <ListItemText
                        primary={message.text}
                        secondary={message.timestamp.toLocaleTimeString()}
                        sx={{
                          textAlign: message.sender === 'user' ? 'right' : 'left',
                          maxWidth: '70%',
                          wordWrap: 'break-word',
                        }}
                      />
                    </Box>
                    {message.context && (
                      <Chip label={message.context} size="small" sx={{ mt: 1 }} />
                    )}
                  </ListItem>
                </Fade>
              ))}
              {isLoading && (
                <ListItem sx={{ justifyContent: 'flex-start' }}>
                  <CircularProgress size={24} />
                </ListItem>
              )}
              <div ref={messagesEndRef} />
            </List>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              variant="outlined"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
              color="primary"
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>

        <Paper sx={{ width: 300, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outlined"
                size="small"
                onClick={() => {
                  setInputText(action.action);
                  handleSendMessage();
                }}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default DigitalConciergeScreen;