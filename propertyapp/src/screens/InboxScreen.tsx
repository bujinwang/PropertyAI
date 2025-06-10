import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { RootStackParamList } from '@/navigation/types';

const conversations = [
  {
    id: '1',
    name: 'John Doe',
    lastMessage: 'Hey, is the apartment still available?',
    timestamp: '10:45 AM',
    unreadCount: 2,
  },
  {
    id: '2',
    name: 'Jane Smith',
    lastMessage: 'I would like to schedule a viewing.',
    timestamp: '9:30 AM',
    unreadCount: 0,
  },
];

export function InboxScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const renderItem = ({ item }: { item: typeof conversations[0] }) => (
    <TouchableOpacity 
      style={styles.conversationItem}
      onPress={() => navigation.navigate('ChatDetail', { chatId: item.id, recipientName: item.name })}
    >
      <View style={styles.avatar} />
      <View style={styles.conversationContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
      <View style={styles.conversationMeta}>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
        {item.unreadCount > 0 && <NotificationBadge count={item.unreadCount} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: SPACING.md,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.text.muted,
    marginRight: SPACING.md,
  },
  conversationContent: {
    flex: 1,
  },
  name: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold as '600',
    color: COLORS.text.primary,
  },
  lastMessage: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs / 2,
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    marginBottom: SPACING.xs,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: SPACING.md + 50,
  },
});
