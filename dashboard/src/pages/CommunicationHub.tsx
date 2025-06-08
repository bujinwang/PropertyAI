import React, { useState } from 'react';
import { Box } from '@mui/material';
import ConversationList from '../components/ConversationList';
import MessageDisplay from '../components/MessageDisplay';
import MessageInput from '../components/MessageInput';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

const mockMessages: { [key: number]: Message[] } = {
  1: [
    { id: 1, text: 'Hello!', sender: 'user' },
    { id: 2, text: 'Hi there!', sender: 'ai' },
  ],
  2: [
    { id: 1, text: 'How are you?', sender: 'user' },
    { id: 2, text: 'I am fine, thank you!', sender: 'ai' },
  ],
};

const CommunicationHub = () => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(1);

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      <Box sx={{ width: '300px', borderRight: '1px solid #ccc' }}>
        <ConversationList onSelectConversation={setSelectedConversation} />
      </Box>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box flexGrow={1} p={2} sx={{ overflowY: 'auto' }}>
          <MessageDisplay messages={mockMessages[selectedConversation || 1]} />
        </Box>
        <Box p={2} sx={{ borderTop: '1px solid #ccc' }}>
          <MessageInput onSendMessage={(text) => console.log(text)} />
        </Box>
      </Box>
    </Box>
  );
};

export default CommunicationHub;
