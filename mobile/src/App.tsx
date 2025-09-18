import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { AppNavigator } from '@/navigation/AppNavigator';
import { theme } from '@/constants/theme';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { realtimeService } from '@/services/realtimeService';
import { pushNotificationService } from '@/services/pushNotificationService';

export default function App() {
  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.recordMetric('firstPaintTime', Date.now());

    // Log performance report on app start
    setTimeout(() => {
      performanceMonitor.logPerformanceReport();
    }, 2000);

    // Save metrics periodically
    const saveMetricsInterval = setInterval(() => {
      performanceMonitor.saveMetricsToStorage();
    }, 30000); // Every 30 seconds

    // Start interaction monitoring
    performanceMonitor.startInteractionMonitoring();

    // Initialize real-time services
    initializeRealtimeServices();

    return () => {
      clearInterval(saveMetricsInterval);
      // Save final metrics on app close
      performanceMonitor.saveMetricsToStorage();
      // Cleanup real-time services
      realtimeService.disconnect();
      pushNotificationService.cleanup();
    };
  }, []);

  const initializeRealtimeServices = async () => {
    try {
      // Initialize WebSocket connection
      const connected = await realtimeService.connect();
      if (connected) {
        console.log('🔗 Real-time services connected successfully');

        // Subscribe to global events
        realtimeService.subscribeToNotifications((notification) => {
          console.log('📬 Real-time notification:', notification);
        });

        realtimeService.subscribeToSystemAlerts((alert) => {
          console.log('🚨 System alert:', alert);
        });

        // Set up connection status monitoring
        const unsubscribeConnection = realtimeService.onConnectionChange((connected) => {
          if (connected) {
            console.log('🟢 Real-time connection restored');
          } else {
            console.log('🔴 Real-time connection lost');
          }
        });

        // Cleanup function will be called on unmount
        return unsubscribeConnection;
      } else {
        console.warn('Failed to connect to real-time services');
      }
    } catch (error) {
      console.error('Failed to initialize real-time services:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <ThemeProvider>
          <NetworkProvider>
            <AuthProvider>
              <NavigationContainer>
                <AppNavigator />
                <StatusBar style="auto" />
              </NavigationContainer>
            </AuthProvider>
          </NetworkProvider>
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
