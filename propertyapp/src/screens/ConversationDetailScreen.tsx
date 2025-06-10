import React from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/types';

type ConversationDetailScreenRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;

const messages = [
  { id: '1', text: 'Hey, is the apartment still available?', sender: 'user' },
  { id: '2', text: 'Yes, it is. Are you interested in a viewing?', sender: 'agent' },
  { id: '3', text: 'I would like to schedule a viewing.', sender: 'user' },
];

export function ConversationDetailScreen() {
  const route = useRoute<ConversationDetailScreenRouteProp>();
  const { chatId, recipientName } = route.params;

  const renderItem = ({ item }: { item: typeof messages[0] }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'user' ? styles.userMessageContainer : styles.agentMessageContainer
    ]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
        />
        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  messageList: {
    padding: SPACING.md,
  },
  messageContainer: {
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    maxWidth: '80%',
  },
  userMessageContainer: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
  },
  agentMessageContainer: {
    backgroundColor: COLORS.card,
    alignSelf: 'flex-start',
  },
  messageText: {
    color: COLORS.text.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold as '600',
  },
});
