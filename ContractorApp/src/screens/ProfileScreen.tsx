import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Button,
  Avatar,
  List,
  Divider,
  Chip,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  if (!user || !user.vendor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile information not available</Text>
      </View>
    );
  }

  const vendor = user.vendor;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          <Avatar.Text 
            size={80} 
            label={initials} 
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Chip
              icon="account-hard-hat"
              mode="outlined"
              style={styles.roleChip}
            >
              Contractor
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Vendor Information */}
      <Card style={styles.card}>
        <Card.Title 
          title="Company Information" 
          left={(props) => <Ionicons {...props} name="business-outline" size={24} />}
        />
        <Card.Content>
          <List.Item
            title="Company Name"
            description={vendor.name}
            left={(props) => <Ionicons {...props} name="business" size={20} />}
          />
          <Divider />
          <List.Item
            title="Phone"
            description={vendor.phone}
            left={(props) => <Ionicons {...props} name="call" size={20} />}
          />
          <Divider />
          <List.Item
            title="Email"
            description={vendor.email}
            left={(props) => <Ionicons {...props} name="mail" size={20} />}
          />
          <Divider />
          <List.Item
            title="Address"
            description={vendor.address}
            left={(props) => <Ionicons {...props} name="location" size={20} />}
          />
        </Card.Content>
      </Card>

      {/* Specialties */}
      <Card style={styles.card}>
        <Card.Title 
          title="Specialty" 
          left={(props) => <Ionicons {...props} name="hammer-outline" size={24} />}
        />
        <Card.Content>
          <Text style={styles.specialtyText}>{vendor.specialty}</Text>
        </Card.Content>
      </Card>

      {/* Service Areas */}
      <Card style={styles.card}>
        <Card.Title 
          title="Service Areas" 
          left={(props) => <Ionicons {...props} name="map-outline" size={24} />}
        />
        <Card.Content>
          <View style={styles.chipContainer}>
            {vendor.serviceAreas.map((area, index) => (
              <Chip
                key={index}
                mode="outlined"
                style={styles.areaChip}
              >
                {area}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Certifications */}
      <Card style={styles.card}>
        <Card.Title 
          title="Certifications" 
          left={(props) => <Ionicons {...props} name="shield-checkmark-outline" size={24} />}
        />
        <Card.Content>
          <View style={styles.chipContainer}>
            {vendor.certifications.map((cert, index) => (
              <Chip
                key={index}
                mode="outlined"
                icon="shield-check"
                style={styles.certChip}
              >
                {cert}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Availability Status */}
      <Card style={styles.card}>
        <Card.Title 
          title="Availability Status" 
          left={(props) => <Ionicons {...props} name="time-outline" size={24} />}
        />
        <Card.Content>
          <View style={styles.availabilityContainer}>
            <Chip
              icon={() => (
                <Ionicons 
                  name={
                    vendor.availability === 'AVAILABLE' ? 'checkmark-circle' :
                    vendor.availability === 'BUSY' ? 'time' : 'close-circle'
                  } 
                  size={16} 
                  color={
                    vendor.availability === 'AVAILABLE' ? '#4CAF50' :
                    vendor.availability === 'BUSY' ? '#FF9800' : '#F44336'
                  }
                />
              )}
              mode="flat"
              textStyle={{ 
                color: vendor.availability === 'AVAILABLE' ? '#4CAF50' :
                       vendor.availability === 'BUSY' ? '#FF9800' : '#F44336'
              }}
              style={[
                styles.availabilityChip,
                {
                  backgroundColor: vendor.availability === 'AVAILABLE' ? '#E8F5E8' :
                                   vendor.availability === 'BUSY' ? '#FFF3E0' : '#FFEBEE'
                }
              ]}
            >
              {vendor.availability}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.card}>
        <Card.Title 
          title="Settings" 
          left={(props) => <Ionicons {...props} name="settings-outline" size={24} />}
        />
        <Card.Content>
          <Button
            mode="outlined"
            onPress={() => {/* TODO: Navigate to settings */}}
            style={styles.settingsButton}
            icon="settings"
          >
            App Settings
          </Button>
          <Button
            mode="outlined"
            onPress={() => {/* TODO: Navigate to notifications settings */}}
            style={styles.settingsButton}
            icon="notifications"
          >
            Notification Settings
          </Button>
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <Card style={[styles.card, styles.logoutCard]}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            buttonColor="#F44336"
            icon="logout"
          >
            Logout
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
    backgroundColor: '#2196F3',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  roleChip: {
    alignSelf: 'flex-start',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  specialtyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  areaChip: {
    marginBottom: 4,
  },
  certChip: {
    marginBottom: 4,
  },
  availabilityContainer: {
    alignItems: 'flex-start',
  },
  availabilityChip: {
    paddingHorizontal: 16,
  },
  settingsButton: {
    marginBottom: 8,
    borderRadius: 8,
  },
  logoutCard: {
    marginBottom: 32,
  },
  logoutButton: {
    borderRadius: 8,
  },
});

export default ProfileScreen;
