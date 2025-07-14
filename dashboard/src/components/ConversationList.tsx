import React from 'react';
import { List, ListItem, ListItemText, ListItemButton } from '@mui/material';

const mockConversations = [
  { id: 1, title: 'John Doe' },
  { id: 2, title: 'Jane Smith' },
];

interface ConversationListProps {
  onSelectConversation: (id: number) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ onSelectConversation }) => {
  return (
    <List>
      {mockConversations.map(convo => (
        <ListItem key={convo.id} disablePadding>
          <ListItemButton onClick={() => onSelectConversation(convo.id)}>
            <ListItemText primary={convo.title} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default ConversationList;
