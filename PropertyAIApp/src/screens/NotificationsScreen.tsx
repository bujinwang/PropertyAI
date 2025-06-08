import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

interface Notification {
  id: string;
  title: string;
  message: string;
}

const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications/123'); // This is a placeholder
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <View>
      <Text>Notifications</Text>
      {notifications.map((notification) => (
        <View key={notification.id}>
          <Text>{notification.title}</Text>
          <Text>{notification.message}</Text>
        </View>
      ))}
    </View>
  );
};

export default NotificationsScreen;
