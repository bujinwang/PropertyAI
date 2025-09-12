import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { NavigationProps } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type CommunicationHubScreenProps = NavigationProps<'Settings'>;

interface Conversation {
  id: string;
  participant: {
    name: string;
    role: 'property_manager' | 'maintenance' | 'leasing_agent';
    avatar: string;
  };
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  messageType: 'text' | 'image' | 'document';
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    participant: {
      name: 'Sarah Johnson',
      role: 'property_manager',
      avatar: '👩‍💼',
    },
    lastMessage: 'Your maintenance request has been approved',
    timestamp: '2024-01-20T10:30:00Z',
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: '2',
    participant: {
      name: 'Mike Chen',
      role: 'maintenance',
      avatar: '👨‍🔧',
    },
    lastMessage: 'I\'ll be at your property tomorrow at 2 PM',
    timestamp: '2024-01-19T16:45:00Z',
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: '3',
    participant: {
      name: 'Lisa Rodriguez',
      role: 'leasing_agent',
      avatar: '👩‍💼',
    },
    lastMessage: 'Thank you for your interest in our property',
    timestamp: '2024-01-18T09:15:00Z',
    unreadCount: 1,
    isOnline: true,
  },
];

const mockMessages: Message[] = [
  {
    id: '1',
    senderId: 'manager',
    senderName: 'Sarah Johnson',
    content: 'Hello! How can I help you today?',
    timestamp: '2024-01-20T10:00:00Z',
    isRead: true,
    messageType: 'text',
  },
  {
    id: '2',
    senderId: 'user',
    senderName: 'You',
    content: 'Hi Sarah, I have a question about my upcoming rent payment.',
    timestamp: '2024-01-20T10:05:00Z',
    isRead: true,
    messageType: 'text',
  },
  {
    id: '3',
    senderId: 'manager',
    senderName: 'Sarah Johnson',
    content: 'Your maintenance request has been approved. The technician will arrive tomorrow between 9 AM and 11 AM.',
    timestamp: '2024-01-20T10:30:00Z',
    isRead: false,
    messageType: 'text',
  },
];

export function CommunicationHubScreen({ navigation }: CommunicationHubScreenProps) {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'property_manager': return '#007bff';
      case 'maintenance': return '#28a745';
      case 'leasing_agent': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const handleConversationPress = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Mark messages as read
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversation.id
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: 'user',
      senderName: 'You',
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isRead: true,
      messageType: 'text',
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleNewMessage = () => {
    setShowNewMessage(true);
  };

  const handleStartNewConversation = () => {
    Alert.alert(
      'New Message',
      'Choose recipient',
      [
        { text: 'Property Manager', onPress: () => startConversation('property_manager') },
        { text: 'Maintenance Team', onPress: () => startConversation('maintenance') },
        { text: 'Leasing Agent', onPress: () => startConversation('leasing_agent') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const startConversation = (role: string) => {
    Alert.alert('New Conversation', `Starting conversation with ${role.replace('_', ' ')}...`);
    setShowNewMessage(false);
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item)}
    >
      <View style={styles.conversationAvatar}>
        <Text style={styles.avatarText}>{item.participant.avatar}</Text>
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.participantName}>{item.participant.name}</Text>
          <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
        </View>

        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>

        <View style={styles.conversationFooter}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.participant.role) }]}>
            <Text style={styles.roleText}>
              {item.participant.role.replace('_', ' ').toUpperCase()}
            </Text>
          </View>

          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.senderId === 'user' ? styles.userMessage : styles.otherMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.senderId === 'user' ? styles.userBubble : styles.otherBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.senderId === 'user' ? styles.userMessageText : styles.otherMessageText,
          ]}
        >
          {message.content}
        </Text>
        <Text
          style={[
            styles.messageTime,
            message.senderId === 'user' ? styles.userMessageTime : styles.otherMessageTime,
          ]}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );

  if (selectedConversation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedConversation(null)}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.chatParticipant}>
            <Text style={styles.participantAvatar}>{selectedConversation.participant.avatar}</Text>
            <View style={styles.participantInfo}>
              <Text style={styles.participantNameChat}>{selectedConversation.participant.name}</Text>
              <Text style={styles.participantRole}>
                {selectedConversation.participant.role.replace('_', ' ')}
              </Text>
            </View>
            {selectedConversation.isOnline && <View style={styles.onlineIndicatorChat} />}
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map(renderMessage)}
        </ScrollView>

        <View style={styles.messageInputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.disabledSendButton]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newMessageButton} onPress={handleNewMessage}>
          <Text style={styles.newMessageText}>+</Text>
        </TouchableOpacity>
      </View>

      {showNewMessage && (
        <View style={styles.newMessageContainer}>
          <TouchableOpacity
            style={styles.newMessageOption}
            onPress={handleStartNewConversation}
          >
            <Text style={styles.newMessageOptionText}>Start New Conversation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelNewMessage}
            onPress={() => setShowNewMessage(false)}
          >
            <Text style={styles.cancelNewMessageText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.conversationsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  newMessageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newMessageText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  newMessageContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  newMessageOption: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  newMessageOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelNewMessage: {
    alignItems: 'center',
    padding: 8,
  },
  cancelNewMessageText: {
    color: '#6c757d',
    fontSize: 14,
  },
  conversationsList: {
    padding: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  conversationAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#28a745',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  timestamp: {
    fontSize: 12,
    color: '#6c757d',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007bff',
  },
  chatParticipant: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantNameChat: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  participantRole: {
    fontSize: 12,
    color: '#6c757d',
    textTransform: 'capitalize',
  },
  onlineIndicatorChat: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#28a745',
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#007bff',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#212529',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#6c757d',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 12,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  disabledSendButton: {
    backgroundColor: '#6c757d',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});