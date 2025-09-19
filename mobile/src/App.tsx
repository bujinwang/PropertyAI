import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { AppNavigator } from '@/navigation/AppNavigator';
import { theme } from '@/constants/theme';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { realtimeService } from '@/services/realtimeService';
import { pushNotificationService } from '@/services/pushNotificationService';

function AppContent() {
  const { isAuthenticated, tokens, user } = useAuth();

  useEffect(() => {
    console.log('🔄 AppContent useEffect triggered:', { isAuthenticated, hasToken: !!tokens?.accessToken, userId: user?.id });

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

    // Initialize real-time services only if authenticated
    if (isAuthenticated && tokens?.accessToken) {
      console.log('🔗 Attempting WebSocket connection with token...');
      initializeRealtimeServices(tokens.accessToken, user?.id);
    } else {
      console.log('⏳ Skipping WebSocket connection - not authenticated yet');
    }

    return () => {
      clearInterval(saveMetricsInterval);
      // Save final metrics on app close
      performanceMonitor.saveMetricsToStorage();
      // Cleanup real-time services
      realtimeService.disconnect();
      pushNotificationService.cleanup();
    };
  }, [isAuthenticated, tokens?.accessToken, user?.id]);

  const initializeRealtimeServices = async (authToken: string, userId?: string) => {
    try {
      // Initialize WebSocket connection with authentication
      const connected = await realtimeService.connect(authToken);
      if (connected) {
        console.log('🔗 Real-time services connected successfully');

        // Update user ID for WebSocket service
        if (userId) {
          realtimeService.updateUserId(userId);
        }

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
            <NavigationContainer>
              <AppNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </NetworkProvider>
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default function App() {

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <ThemeProvider>
          <NetworkProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </NetworkProvider>
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
