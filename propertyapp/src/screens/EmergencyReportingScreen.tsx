import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Vibration,
} from 'react-native';
import { NavigationProps } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type EmergencyReportingScreenProps = NavigationProps<'Settings'>;

interface EmergencyType {
  id: string;
  title: string;
  description: string;
  icon: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  responseTime: string;
  contacts: string[];
}

interface EmergencyReport {
  id: string;
  type: string;
  description: string;
  location: string;
  severity: string;
  timestamp: string;
  status: 'reported' | 'acknowledged' | 'responding' | 'resolved';
  responder?: string;
  estimatedArrival?: string;
}

const emergencyTypes: EmergencyType[] = [
  {
    id: 'fire',
    title: 'Fire Emergency',
    description: 'Fire, smoke, or burning smell',
    icon: '🔥',
    severity: 'critical',
    responseTime: 'Immediate (2-5 minutes)',
    contacts: ['Fire Department', 'Property Management'],
  },
  {
    id: 'medical',
    title: 'Medical Emergency',
    description: 'Injury, illness, or medical assistance needed',
    icon: '🚑',
    severity: 'critical',
    responseTime: 'Immediate (5-10 minutes)',
    contacts: ['Emergency Services', 'Medical Team'],
  },
  {
    id: 'security',
    title: 'Security Threat',
    description: 'Intruder, suspicious activity, or safety concern',
    icon: '🚨',
    severity: 'high',
    responseTime: '5-15 minutes',
    contacts: ['Security Team', 'Police'],
  },
  {
    id: 'flooding',
    title: 'Flooding/Water Damage',
    description: 'Water leak, flooding, or burst pipe',
    icon: '💧',
    severity: 'high',
    responseTime: '15-30 minutes',
    contacts: ['Maintenance Team', 'Property Management'],
  },
  {
    id: 'power',
    title: 'Power Outage',
    description: 'Complete or partial electrical failure',
    icon: '⚡',
    severity: 'medium',
    responseTime: '30-60 minutes',
    contacts: ['Maintenance Team', 'Utility Company'],
  },
  {
    id: 'lockout',
    title: 'Lockout',
    description: 'Locked out of property or lost keys',
    icon: '🔐',
    severity: 'low',
    responseTime: '30-90 minutes',
    contacts: ['Maintenance Team', 'Property Management'],
  },
];

const mockEmergencyHistory: EmergencyReport[] = [
  {
    id: '1',
    type: 'Power Outage',
    description: 'Complete power failure in apartment',
    location: 'Unit 204',
    severity: 'medium',
    timestamp: '2024-01-15T14:30:00Z',
    status: 'resolved',
    responder: 'Mike Chen',
    estimatedArrival: '2024-01-15T15:00:00Z',
  },
  {
    id: '2',
    type: 'Plumbing Issue',
    description: 'Leaking faucet in kitchen',
    location: 'Unit 204 - Kitchen',
    severity: 'low',
    timestamp: '2024-01-10T09:15:00Z',
    status: 'resolved',
    responder: 'Sarah Johnson',
    estimatedArrival: '2024-01-10T11:00:00Z',
  },
];

export function EmergencyReportingScreen({ navigation }: EmergencyReportingScreenProps) {
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyType | null>(null);
  const [emergencyHistory, setEmergencyHistory] = useState<EmergencyReport[]>(mockEmergencyHistory);
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    // Trigger vibration for critical emergencies when selected
    if (selectedEmergency?.severity === 'critical') {
      Vibration.vibrate([0, 500, 200, 500]);
    }
  }, [selectedEmergency]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return '#ffc107';
      case 'acknowledged': return '#17a2b8';
      case 'responding': return '#007bff';
      case 'resolved': return '#28a745';
      default: return '#6c757d';
    }
  };

  const handleEmergencySelect = (emergency: EmergencyType) => {
    setSelectedEmergency(emergency);
  };

  const handleReportEmergency = () => {
    if (!selectedEmergency) return;

    Alert.alert(
      'Confirm Emergency Report',
      `Are you sure you want to report a ${selectedEmergency.title.toLowerCase()}? This will immediately notify emergency services and property management.`,
      [
        {
          text: 'Report Emergency',
          style: 'destructive',
          onPress: () => submitEmergencyReport(),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const submitEmergencyReport = () => {
    setIsReporting(true);

    // Simulate emergency reporting
    setTimeout(() => {
      setIsReporting(false);
      Alert.alert(
        'Emergency Reported',
        'Your emergency has been reported. Help is on the way. Stay in a safe location and follow any instructions from emergency personnel.',
        [
          {
            text: 'Call Emergency Services',
            onPress: () => Alert.alert('Emergency', 'Calling 911...'),
          },
          { text: 'OK', style: 'cancel' },
        ]
      );

      // Add to history
      const newReport: EmergencyReport = {
        id: Date.now().toString(),
        type: selectedEmergency!.title,
        description: `Emergency: ${selectedEmergency!.description}`,
        location: 'Current Location',
        severity: selectedEmergency!.severity,
        timestamp: new Date().toISOString(),
        status: 'reported',
      };

      setEmergencyHistory(prev => [newReport, ...prev]);
      setSelectedEmergency(null);
    }, 2000);
  };

  const handleCallEmergency = (number: string) => {
    Alert.alert('Emergency Call', `Calling ${number}...`);
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const renderEmergencyType = (emergency: EmergencyType) => (
    <TouchableOpacity
      key={emergency.id}
      style={[
        styles.emergencyCard,
        selectedEmergency?.id === emergency.id && styles.selectedEmergency,
        { borderLeftColor: getSeverityColor(emergency.severity) },
      ]}
      onPress={() => handleEmergencySelect(emergency)}
    >
      <View style={styles.emergencyHeader}>
        <View style={styles.emergencyIcon}>
          <Text style={styles.iconText}>{emergency.icon}</Text>
        </View>
        <View style={styles.emergencyInfo}>
          <Text style={styles.emergencyTitle}>{emergency.title}</Text>
          <Text style={styles.emergencyDescription}>{emergency.description}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(emergency.severity) }]}>
          <Text style={styles.severityText}>{emergency.severity.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.emergencyDetails}>
        <Text style={styles.responseTime}>Response: {emergency.responseTime}</Text>
        <View style={styles.contactsList}>
          {emergency.contacts.map((contact, index) => (
            <Text key={index} style={styles.contactText}>• {contact}</Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmergencyHistory = () => (
    <View style={styles.historySection}>
      <Text style={styles.sectionTitle}>Recent Reports</Text>
      {emergencyHistory.map((report) => {
        const { date, time } = formatDateTime(report.timestamp);
        return (
          <View key={report.id} style={styles.historyItem}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyType}>{report.type}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                <Text style={styles.statusText}>{report.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.historyDescription}>{report.description}</Text>
            <Text style={styles.historyMeta}>
              {date} at {time} • {report.location}
            </Text>
            {report.responder && (
              <Text style={styles.historyResponder}>Responded by: {report.responder}</Text>
            )}
          </View>
        );
      })}
    </View>
  );

  if (selectedEmergency) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.confirmationContainer}>
          <View style={styles.confirmationHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedEmergency(null)}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.confirmationTitle}>Confirm Emergency</Text>
          </View>

          <View style={styles.selectedEmergencyCard}>
            <View style={styles.selectedEmergencyIcon}>
              <Text style={styles.selectedIconText}>{selectedEmergency.icon}</Text>
            </View>
            <Text style={styles.selectedEmergencyTitle}>{selectedEmergency.title}</Text>
            <Text style={styles.selectedEmergencyDescription}>
              {selectedEmergency.description}
            </Text>

            <View style={styles.emergencyStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Severity</Text>
                <Text style={[styles.statValue, { color: getSeverityColor(selectedEmergency.severity) }]}>
                  {selectedEmergency.severity.toUpperCase()}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Response Time</Text>
                <Text style={styles.statValue}>{selectedEmergency.responseTime}</Text>
              </View>
            </View>
          </View>

          <View style={styles.warningSection}>
            <Text style={styles.warningTitle}>⚠️ Emergency Protocol</Text>
            <Text style={styles.warningText}>
              • Stay calm and ensure your safety{'\n'}
              • Do not attempt to fix the issue yourself{'\n'}
              • Provide clear details about the emergency{'\n'}
              • Follow instructions from emergency responders
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setSelectedEmergency(null)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.reportButton, isReporting && styles.disabledButton]}
              onPress={handleReportEmergency}
              disabled={isReporting}
            >
              <Text style={styles.reportButtonText}>
                {isReporting ? 'Reporting...' : 'Report Emergency'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Emergency Reporting</Text>
          <Text style={styles.subtitle}>Report emergencies and get immediate assistance</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleCallEmergency('911')}
          >
            <Text style={styles.quickActionIcon}>🚨</Text>
            <Text style={styles.quickActionText}>Call 911</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleCallEmergency('Property Management')}
          >
            <Text style={styles.quickActionIcon}>📞</Text>
            <Text style={styles.quickActionText}>Property Mgmt</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emergencyTypes}>
          <Text style={styles.sectionTitle}>Report an Emergency</Text>
          {emergencyTypes.map(renderEmergencyType)}
        </View>

        {renderEmergencyHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#dc3545',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emergencyTypes: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  emergencyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
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
  selectedEmergency: {
    borderColor: '#007bff',
    backgroundColor: '#f8f9ff',
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  emergencyDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  emergencyDetails: {
    marginTop: 8,
  },
  responseTime: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
    marginBottom: 8,
  },
  contactsList: {
    gap: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#6c757d',
  },
  historySection: {
    padding: 20,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  historyDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  historyMeta: {
    fontSize: 12,
    color: '#6c757d',
  },
  historyResponder: {
    fontSize: 12,
    color: '#007bff',
    marginTop: 4,
  },
  confirmationContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007bff',
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  selectedEmergencyCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedEmergencyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedIconText: {
    fontSize: 32,
  },
  selectedEmergencyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },
  selectedEmergencyDescription: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  emergencyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningSection: {
    backgroundColor: '#fff3cd',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    margin: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    flex: 2,
    backgroundColor: '#dc3545',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});