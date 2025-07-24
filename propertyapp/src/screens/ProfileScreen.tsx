import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingItem {
  id: string;
  title: string;
  description?: string;
  icon: string;
  type: 'navigate' | 'toggle' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
    pushNotifications: true,
    biometricAuth: false,
    aiRecommendations: true,
    darkMode: false,
  });

  const handleSettingToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    navigation.navigate('EditProfile' as any);
  };

  const handlePrivacySettings = () => {
    navigation.navigate('DataPrivacyCompliance');
  };

  const settingItems: SettingItem[] = [
    {
      id: 'notifications',
      title: 'Push Notifications',
      description: 'Receive push notifications',
      icon: 'notifications-outline',
      type: 'toggle',
      value: settings.pushNotifications,
      onToggle: (value) => handleSettingToggle('pushNotifications'),
    },
    {
      id: 'email-alerts',
      title: 'Email Alerts',
      description: 'Get important updates via email',
      icon: 'mail-outline',
      type: 'toggle',
      value: settings.emailAlerts,
      onToggle: (value) => handleSettingToggle('emailAlerts'),
    },
    {
      id: 'biometric-auth',
      title: 'Biometric Authentication',
      description: 'Use Face ID/Touch ID to unlock app',
      icon: 'finger-print-outline',
      type: 'toggle',
      value: settings.biometricAuth,
      onToggle: (value) => handleSettingToggle('biometricAuth'),
    },
    {
      id: 'ai-recommendations',
      title: 'AI Recommendations',
      description: 'Receive personalized AI suggestions',
      icon: 'bulb-outline',
      type: 'toggle',
      value: settings.aiRecommendations,
      onToggle: (value) => handleSettingToggle('aiRecommendations'),
    },
    {
      id: 'dark-mode',
      title: 'Dark Mode',
      description: 'Use dark theme',
      icon: 'moon-outline',
      type: 'toggle',
      value: settings.darkMode,
      onToggle: (value) => handleSettingToggle('darkMode'),
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Manage your privacy settings',
      icon: 'shield-checkmark-outline',
      type: 'navigate',
      onPress: handlePrivacySettings,
    },
    {
      id: 'help',
      title: 'Help & Support',
      description: 'Get help and contact support',
      icon: 'help-circle-outline',
      type: 'navigate',
      onPress: () => navigation.navigate('Support' as any),
    },
    {
      id: 'about',
      title: 'About',
      description: 'App version and legal information',
      icon: 'information-circle-outline',
      type: 'navigate',
      onPress: () => navigation.navigate('About' as any),
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.type === 'navigate' ? item.onPress : undefined}
      disabled={item.type === 'toggle'}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon as any} size={24} color="#666" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.settingDescription}>{item.description}</Text>
          )}
        </View>
      </View>
      
      {item.type === 'toggle' && item.value !== undefined && (
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          trackColor={{ false: '#ccc', true: '#007AFF' }}
          thumbColor="#fff"
        />
      )}
      
      {item.type === 'navigate' && (
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleEditProfile}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
            <View style={styles.editIcon}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userRole}>{user?.role}</Text>
          
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account Information */}
        <Card style={styles.section}>
          <Card.Title title="Account Information" />
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{user?.firstName} {user?.lastName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Not provided'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member since</Text>
              <Text style={styles.infoValue}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Preferences */}
        <Card style={styles.section}>
          <Card.Title title="Preferences" />
          <Card.Content>
            {settingItems.slice(0, 5).map(renderSettingItem)}
          </Card.Content>
        </Card>

        {/* General */}
        <Card style={styles.section}>
          <Card.Title title="General" />
          <Card.Content>
            {settingItems.slice(5).map(renderSettingItem)}
          </Card.Content>
        </Card>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <Button
            title="Log Out"
            variant="outline"
            onPress={handleLogout}
            style={styles.logoutButton}
            textStyle={styles.logoutButtonText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  editButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutSection: {
    marginHorizontal: 16,
    marginVertical: 24,
  },
  logoutButton: {
    borderColor: '#FF3B30',
  },
  logoutButtonText: {
    color: '#FF3B30',
  },
});

export default ProfileScreen;