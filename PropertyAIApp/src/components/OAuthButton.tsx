import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';

interface OAuthButtonProps {
  provider: 'google' | 'facebook';
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const providerConfig = {
  google: {
    label: 'Sign in with Google',
    icon: require('../assets/images/google-logo.png'),
    style: {
      backgroundColor: '#4285F4',
    },
  },
  facebook: {
    label: 'Sign in with Facebook',
    icon: require('../assets/images/facebook-logo.png'),
    style: {
      backgroundColor: '#1877F2',
    },
  },
};

const OAuthButton: React.FC<OAuthButtonProps> = ({ provider, onPress, disabled, isLoading }) => {
  const { label, icon, style } = providerConfig[provider];

  return (
    <TouchableOpacity
      style={[styles.button, style, (disabled || isLoading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || isLoading}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {isLoading ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          <Image source={icon} style={styles.icon} />
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 15,
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default OAuthButton;
