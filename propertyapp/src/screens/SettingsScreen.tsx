import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts';
import { Card } from '@/components/ui/Card';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingItem {
  id: string;
  title: string;
  description?: string;
  icon: string;
  type: 'navigate' | 'toggle' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
}

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<SettingsNavigationProp>();

  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
    pushNotifications: true,
    biometricAuth: false,
    darkMode: false,
    marketingEmails: false,
    analytics: true,
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete account') },
      ]
    );
  };

  const settingItems: SettingItem[] = [
    {
      id: 'notifications',
      title: 'Push Notifications',
      description: 'Receive push notifications for important updates',
      icon: 'notifications-outline',
      type: 'toggle',
      value: settings.pushNotifications,
      onToggle: (value) => handleSettingToggle('pushNotifications'),
    },
    {
      id: 'email-alerts',
      title: 'Email Alerts',
      description: 'Get email notifications for rent reminders and maintenance updates',
      icon: 'mail-outline',
      type: 'toggle',
      value: settings.emailAlerts,
      onToggle: (value) => handleSettingToggle('emailAlerts'),
    },
    {
      id: 'biometric-auth',
      title: 'Biometric Authentication',
      description: 'Use Face ID/Touch ID to unlock the app',
      icon: 'finger-print-outline',
      type: 'toggle',
      value: settings.biometricAuth,
      onToggle: (value) => handleSettingToggle('biometricAuth'),
    },
    {
      id: 'dark-mode',
      title: 'Dark Mode',
      description: 'Use dark theme for better visibility at night',
      icon: 'moon-outline',
      type: 'toggle',
      value: settings.darkMode,
      onToggle: (value) => handleSettingToggle('darkMode'),
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Manage your data privacy and security settings',
      icon: 'shield-checkmark-outline',
      type: 'navigate',
      onPress: () => navigation.navigate('DataPrivacyCompliance'),
    },
    {
      id: 'notifications-settings',
      title: 'Notification Preferences',
      description: 'Customize what notifications you receive',
      icon: 'settings-outline',
      type: 'navigate',
      onPress: () => navigation.navigate('NotificationSettings' as any),
    },
    {
      id: 'payment-methods',
      title: 'Payment Methods',
      description: 'Manage your saved payment methods',
      icon: 'card-outline',
      type: 'navigate',
      onPress: () => navigation.navigate('PaymentMethods' as any),
    },
    {
      id: 'help',
      title: 'Help & Support',
      description: 'Get help and contact customer support',
      icon: 'help-circle-outline',
      type: 'navigate',
      onPress: () => navigation.navigate('Support' as any),
    },
    {
      id: 'about',
      title: 'About',
      description: 'App version, terms of service, and privacy policy',
      icon: 'information-circle-outline',
      type: 'navigate',
      onPress: () => navigation.navigate('About' as any),
    },
  ];

  const accountItems: SettingItem[] = [
    {
      id: 'profile',
      title: 'Edit Profile',
      description: 'Update your personal information',
      icon: 'person-outline',
      type: 'navigate',
      onPress: () => navigation.navigate('EditProfile' as any),
    },
    {
      id: 'change-password',
      title: 'Change Password',
      description: 'Update your account password',
      icon: 'lock-closed-outline',
      type: 'navigate',
      onPress: () => navigation.navigate('ChangePassword' as any),
    },
    {
      id: 'two-factor',
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      icon: 'key-outline',
      type: 'navigate',
      onPress: () => navigation.navigate('TwoFactorAuth' as any),
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingItem, item.destructive && styles.destructiveItem]}
      onPress={item.type === 'navigate' || item.type === 'action' ? item.onPress : undefined}
      disabled={item.type === 'toggle'}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, item.destructive && styles.destructiveIconContainer]}>
          <Ionicons name={item.icon as any} size={24} color={item.destructive ? '#FF3B30' : '#666'} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, item.destructive && styles.destructiveText]}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={[styles.settingDescription, item.destructive && styles.destructiveText]}>
              {item.description}
            </Text>
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Account Section */}
        <Card style={styles.section}>
          <Card.Title title="Account" />
          <Card.Content>
            {accountItems.map(renderSettingItem)}
          </Card.Content>
        </Card>

        {/* Preferences Section */}
        <Card style={styles.section}>
          <Card.Title title="Preferences" />
          <Card.Content>
            {settingItems.slice(0, 4).map(renderSettingItem)}
          </Card.Content>
        </Card>

        {/* General Section */}
        <Card style={styles.section}>
          <Card.Title title="General" />
          <Card.Content>
            {settingItems.slice(4).map(renderSettingItem)}
          </Card.Content>
        </Card>

        {/* Account Actions */}
        <Card style={styles.section}>
          <Card.Title title="Account Actions" />
          <Card.Content>
            <TouchableOpacity
              style={[styles.settingItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, styles.logoutIconContainer]}>
                  <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, styles.logoutText]}>Log Out</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, styles.destructiveItem]}
              onPress={handleDeleteAccount}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, styles.destructiveIconContainer]}>
                  <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, styles.destructiveText]}>Delete Account</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>PropertyAI v1.0.0</Text>
          <Text style={styles.appDescription}>AI-Powered Property Management Platform</Text>
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
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
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
  destructiveIconContainer: {
    backgroundColor: '#ffe5e5',
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
  destructiveItem: {
    borderBottomColor: '#ffe5e5',
  },
  destructiveText: {
    color: '#FF3B30',
  },
  logoutItem: {
    borderBottomColor: '#ffe5e5',
  },
  logoutIconContainer: {
    backgroundColor: '#ffe5e5',
  },
  logoutText: {
    color: '#FF3B30',
  },
  appInfo: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default SettingsScreen;