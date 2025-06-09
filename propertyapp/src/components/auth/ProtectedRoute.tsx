import React, { ReactElement } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts';
import { Button } from '@/@propertyai/shared/components/Button';
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: ReactElement;
  allowedRoles: UserRole[];
  fallback?: ReactElement;
}

/**
 * A component that restricts access to children based on user role
 * If the user doesn't have the required role, it displays a fallback component
 * or a default unauthorized message
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallback,
}) => {
  const { user, logout } = useAuth();

  // If no user or user has no role, they're unauthorized
  if (!user || !user.role) {
    return fallback || (
      <View style={styles.container}>
        <Text style={styles.title}>Unauthorized Access</Text>
        <Text style={styles.message}>
          You are not authorized to view this content. Please log in with an appropriate account.
        </Text>
        <Button 
          title="Log Out" 
          variant="primary" 
          onPress={logout}
          style={styles.button}
        />
      </View>
    );
  }

  // Check if user's role is in the allowed roles list
  const hasAccess = allowedRoles.includes(user.role as UserRole);

  if (!hasAccess) {
    return fallback || (
      <View style={styles.container}>
        <Text style={styles.title}>Access Restricted</Text>
        <Text style={styles.message}>
          Your current role ({user.role}) does not have permission to access this feature.
        </Text>
        <Button 
          title="Go Back" 
          variant="outline" 
          onPress={() => {
            // Handle navigation back
            // This would typically use navigation, but we're keeping it simple
          }}
          style={styles.button}
        />
      </View>
    );
  }

  // User has the required role, render children
  return children;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 24,
  },
  button: {
    width: '80%',
    marginTop: 10,
  },
}); 