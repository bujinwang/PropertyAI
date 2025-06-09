import React, { useState, useEffect } from 'react';
import ConversationList from './ConversationList';
import MessageDisplay from './MessageDisplay';
import MessageInput from './MessageInput';
import { analyzeSentiment, getMessages } from '../services/apiService';
import { SentimentResponse, Message } from '../types/types';

const CommunicationHub: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (selectedConversation) {
      getMessages(selectedConversation).then((data) => setMessages(data));
    }
  }, [selectedConversation]);

  const handleSendMessage = async (message: string) => {
    if (selectedConversation) {
      const { sentiment } = (await analyzeSentiment(
        message
      )) as SentimentResponse;
      const newMessage: Message = {
        id: messages.length + 1,
        text: message,
        sender: 'user',
        sentiment,
      };
      setMessages([...messages, newMessage]);
    }
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
