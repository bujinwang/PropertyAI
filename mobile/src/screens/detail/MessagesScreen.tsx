import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Text,
  TextInput,
  IconButton,
  Avatar,
  Card,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  isMe: boolean;
  type: 'text' | 'system';
}

interface MessagesScreenProps {
  route: {
    params: {
      requestId: string;
      title?: string;
    };
  };
  navigation: any;
}

export function MessagesScreen({ route, navigation }: MessagesScreenProps) {
  const { requestId, title = 'Messages' } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    navigation.setOptions({ title });
    loadMessages();
  }, [requestId]);

  const loadMessages = async () => {
    try {
      setLoading(true);

      // In production, fetch from API
      // const response = await messageService.getMessages(requestId);
      // setMessages(response.data);

      // Mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const mockMessages: Message[] = [
        {
          id: '1',
          text: 'Maintenance request created',
          senderId: 'system',
          senderName: 'System',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          isMe: false,
          type: 'system',
        },
        {
          id: '2',
          text: 'Hi, I noticed the kitchen faucet is leaking. Could you take a look?',
          senderId: 'user1',
          senderName: 'John Doe',
          timestamp: new Date(Date.now() - 3600000 * 23).toISOString(),
          isMe: true,
          type: 'text',
        },
        {
          id: '3',
          text: "Thanks for reporting this. I'll send a technician tomorrow morning.",
          senderId: 'manager1',
          senderName: 'Property Manager',
          timestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
          isMe: false,
          type: 'text',
        },
        {
          id: '4',
          text: 'Great, what time should I expect them?',
          senderId: 'user1',
          senderName: 'John Doe',
          timestamp: new Date(Date.now() - 3600000 * 21).toISOString(),
          isMe: true,
          type: 'text',
        },
        {
          id: '5',
          text: 'Between 9-11 AM. They will call before arriving.',
          senderId: 'manager1',
          senderName: 'Property Manager',
          timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
          isMe: false,
          type: 'text',
        },
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      return;
    }

    try {
      setSending(true);

      const message: Message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        senderId: 'user1',
        senderName: 'You',
        timestamp: new Date().toISOString(),
        isMe: true,
        type: 'text',
      };

      // Optimistic update
      setMessages([...messages, message]);
      setNewMessage('');

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // In production, send to API
      // await messageService.sendMessage(requestId, newMessage);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const renderMessage = (message: Message) => {
    if (message.type === 'system') {
      return (
        <View key={message.id} style={styles.systemMessageContainer}>
          <Chip icon="information" mode="outlined" style={styles.systemChip}>
            {message.text}
          </Chip>
          <Text variant="caption" style={styles.systemTimestamp}>
            {formatTimestamp(message.timestamp)}
          </Text>
        </View>
      );
    }

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.isMe ? styles.myMessage : styles.theirMessage,
        ]}
      >
        {!message.isMe && (
          <Avatar.Text
            size={36}
            label={message.senderName.charAt(0)}
            style={styles.avatar}
          />
        )}

        <View
          style={[
            styles.messageBubble,
            message.isMe ? styles.myBubble : styles.theirBubble,
          ]}
        >
          {!message.isMe && (
            <Text variant="labelSmall" style={styles.senderName}>
              {message.senderName}
            </Text>
          )}
          <Text variant="bodyMedium" style={styles.messageText}>
            {message.text}
          </Text>
          <Text variant="caption" style={styles.timestamp}>
            {formatTimestamp(message.timestamp)}
          </Text>
        </View>

        {message.isMe && (
          <Avatar.Text
            size={36}
            label={message.senderName.charAt(0)}
            style={styles.avatar}
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No messages yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Start a conversation below
              </Text>
            </View>
          ) : (
            messages.map(renderMessage)
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            style={styles.input}
            multiline
            maxLength={500}
            disabled={sending}
            right={
              <TextInput.Affix
                text={`${newMessage.length}/500`}
                textStyle={styles.charCount}
              />
            }
          />
          <IconButton
            icon="send"
            mode="contained"
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
            loading={sending}
            style={styles.sendButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemChip: {
    backgroundColor: '#e3f2fd',
  },
  systemTimestamp: {
    marginTop: 4,
    color: '#999',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  theirMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginHorizontal: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: '#1976d2',
  },
  theirBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  senderName: {
    marginBottom: 4,
    color: '#666',
    fontWeight: '600',
  },
  messageText: {
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginBottom: 8,
    color: '#666',
  },
  emptySubtext: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
  },
  charCount: {
    fontSize: 10,
    color: '#999',
  },
  sendButton: {
    marginBottom: 4,
  },
});

export default MessagesScreen;
