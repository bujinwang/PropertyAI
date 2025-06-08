import React, { useState } from 'react';
import ConversationList from './ConversationList';
import MessageDisplay from './MessageDisplay';
import MessageInput from './MessageInput';

const CommunicationHub: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  const handleSendMessage = (message: string) => {
    // Handle sending message
  };

  return (
    <div className="communication-hub">
      <ConversationList onSelectConversation={setSelectedConversation} />
      <div className="chat-area">
        <MessageDisplay messages={messages} />
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default CommunicationHub;
