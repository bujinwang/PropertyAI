import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to analytics service
    // Example: analytics.logError(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={styles.errorCard}>
            <Card.Title 
              title="Oops! Something went wrong" 
              subtitle="We're working to fix this issue"
            />
            <Card.Content>
              <View style={styles.errorContent}>
                <Text style={styles.errorTitle}>Error Details</Text>
                <Text style={styles.errorMessage}>
                  {this.state.error?.message || 'An unexpected error occurred'}
                </Text>
                
                {__DEV__ && this.state.errorInfo && (
                  <View style={styles.stackTrace}>
                    <Text style={styles.stackTraceTitle}>Stack Trace</Text>
                    <Text style={styles.stackTraceText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </View>
                )}
              </View>
            </Card.Content>
            <Card.Actions>
              <Button
                title="Try Again"
                variant="primary"
                onPress={this.resetError}
                style={styles.actionButton}
              />
              <Button
                title="Go Back"
                variant="outline"
                onPress={() => {
                  // Navigate back or to a safe screen
                  // This would typically use navigation.goBack()
                  this.resetError();
                }}
              />
            </Card.Actions>
          </Card>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

// Screen-specific error states
export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  showSupport?: boolean;
}> = ({ 
  title = "Something went wrong", 
  message = "We couldn't load the content", 
  onRetry, 
  showSupport = true 
}) => (
  <View style={styles.errorState}>
    <Card style={styles.errorCard}>
      <Card.Title title={title} subtitle={message} />
      <Card.Content>
        <View style={styles.errorActions}>
          {onRetry && (
            <Button
              title="Try Again"
              variant="primary"
              onPress={onRetry}
              style={styles.actionButton}
            />
          )}
          {showSupport && (
            <Button
              title="Contact Support"
              variant="outline"
              onPress={() => {
                // Open support contact
              }}
            />
          )}
        </View>
      </Card.Content>
    </Card>
  </View>
);

// Network error state
export const NetworkError: React.FC<{
  onRetry?: () => void;
}> = ({ onRetry }) => (
  <ErrorState
    title="Connection Error"
    message="Please check your internet connection and try again"
    onRetry={onRetry}
  />
);

// Empty state component
export const EmptyState: React.FC<{
  title?: string;
  message?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ 
  title = "No items found", 
  message = "There are no items to display", 
  icon = "📭",
  actionLabel,
  onAction 
}) => (
  <View style={styles.emptyState}>
    <Card style={styles.emptyCard}>
      <Card.Content>
        <Text style={styles.emptyIcon}>{icon}</Text>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyMessage}>{message}</Text>
        {actionLabel && onAction && (
          <Button
            title={actionLabel}
            variant="primary"
            onPress={onAction}
            style={styles.emptyAction}
          />
        )}
      </Card.Content>
    </Card>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  errorCard: {
    margin: 16,
  },
  errorContent: {
    paddingVertical: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  stackTrace: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  stackTraceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  stackTraceText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  actionButton: {
    marginRight: 8,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyCard: {
    maxWidth: 300,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyAction: {
    marginTop: 8,
  },
});