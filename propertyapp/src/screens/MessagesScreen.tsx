import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts';
import { Card } from '@/components/ui/Card';
import { shadows } from '@/utils/shadows';

interface Message {
  id: string;
  sender: {
    name: string;
    avatar?: string;
    role: string;
  };
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'message' | 'maintenance' | 'payment' | 'announcement';
  property?: string;
}

export const MessagesScreen: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'maintenance' | 'payment'>('all');

  // Replace with real API call
  const fetchMessages = async () => {
    try {
      // Simulate API call - replace with real API
      setTimeout(() => {
        const realMessages: Message[] = [
          {
            id: '1',
            sender: {
              name: 'Sarah Johnson',
              avatar: '',
              role: 'Property Manager',
            },
            content: 'Your maintenance request for Unit 2B has been confirmed for tomorrow at 2 PM.',
            timestamp: '2 hours ago',
            isRead: false,
            type: 'maintenance',
            property: 'Sunset Apartments',
          },
          {
            id: '2',
            sender: {
              name: 'John Smith',
              avatar: '',
              role: 'Tenant',
            },
            content: 'Hi, I\'m interested in scheduling a viewing for the 2-bedroom unit.',
            timestamp: '1 day ago',
            isRead: true,
            type: 'message',
            property: 'Oakwood Heights',
          },
          {
            id: '3',
            sender: {
              name: 'PropertyFlow AI',
              role: 'System',
            },
            content: 'Rent payment reminder: Your rent for December is due in 3 days.',
            timestamp: '2 days ago',
            isRead: false,
            type: 'payment',
            property: 'Riverside Plaza',
          },
          {
            id: '4',
            sender: {
              name: 'Building Management',
              role: 'System',
            },
            content: 'Scheduled maintenance: Water will be shut off on Saturday from 9 AM to 12 PM.',
            timestamp: '3 days ago',
            isRead: true,
            type: 'announcement',
            property: 'All Properties',
          },
        ];
        setMessages(realMessages);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         message.sender.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'unread') return !message.isRead && matchesSearch;
    if (selectedFilter === 'maintenance') return message.type === 'maintenance' && matchesSearch;
    if (selectedFilter === 'payment') return message.type === 'payment' && matchesSearch;
    return matchesSearch;
  });

  const renderMessageItem = ({ item }: { item: Message }) => (
    <TouchableOpacity style={styles.messageItem}>
      <View style={styles.messageContent}>
        <View style={styles.avatarContainer}>
          {item.sender.avatar ? (
            <Image source={{ uri: item.sender.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={20} color="#666" />
            </View>
          )}
        </View>
        
        <View style={styles.messageDetails}>
          <View style={styles.messageHeader}>
            <Text style={[styles.senderName, !item.isRead && styles.unreadText]}>
              {item.sender.name}
            </Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
          
          <Text style={[styles.messageText, !item.isRead && styles.unreadText]} numberOfLines={2}>
            {item.content}
          </Text>
          
          {item.property && (
            <Text style={styles.propertyText}>{item.property}</Text>
          )}
        </View>
        
        <View style={[styles.typeIndicator, styles[`${item.type}Indicator`]]}>
          <Ionicons
            name={
              item.type === 'maintenance' ? 'construct' :
              item.type === 'payment' ? 'card' :
              item.type === 'announcement' ? 'megaphone' : 'chatbubble'
            }
            size={16}
            color="#fff"
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No messages</Text>
      <Text style={styles.emptyText}>
        You don't have any messages yet. Start a conversation with your property manager or tenants.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newMessageButton}>
          <Ionicons name="create-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'unread', 'maintenance', 'payment'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterButton, selectedFilter === filter && styles.activeFilter]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[styles.filterText, selectedFilter === filter && styles.activeFilterText]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredMessages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  newMessageButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 44,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 10,
  },
  messageItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
    ...shadows.small,
  },
  messageContent: {
    flexDirection: 'row',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  messageDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  unreadText: {
    fontWeight: '700',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  propertyText: {
    fontSize: 12,
    color: '#999',
  },
  typeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  maintenanceIndicator: {
    backgroundColor: '#FF9500',
  },
  paymentIndicator: {
    backgroundColor: '#34C759',
  },
  announcementIndicator: {
    backgroundColor: '#AF52DE',
  },
  messageIndicator: {
    backgroundColor: '#007AFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default MessagesScreen;
