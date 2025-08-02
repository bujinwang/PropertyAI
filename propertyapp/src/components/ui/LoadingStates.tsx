import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingStateProps {
  type?: 'skeleton' | 'spinner' | 'shimmer';
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

// Skeleton loading component
export const SkeletonLoader: React.FC<{
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}> = ({ width, height, borderRadius = 8, style }) => (
  <View style={[
    styles.skeleton,
    { width, height, borderRadius },
    style,
  ]} />
);

// Shimmer effect component
export const Shimmer: React.FC<{
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}> = ({ width, height, borderRadius = 8, style }) => (
  <View style={[
    styles.shimmerContainer,
    { width, height, borderRadius },
    style,
  ]}>
    <LinearGradient
      colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.shimmerGradient}
    />
  </View>
);

// Loading spinner
export const LoadingSpinner: React.FC<{
  size?: 'small' | 'medium' | 'large';
  color?: string;
}> = ({ size = 'medium', color = '#007AFF' }) => {
  const spinnerSize = {
    small: 20,
    medium: 40,
    large: 60,
  }[size];

  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={spinnerSize} color={color} />
    </View>
  );
};

// Loading states for different components
export const CardSkeleton: React.FC = () => (
  <View style={styles.cardContainer}>
    <SkeletonLoader width="100%" height={120} />
    <View style={styles.contentContainer}>
      <SkeletonLoader width="60%" height={20} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="80%" height={16} style={{ marginBottom: 4 }} />
      <SkeletonLoader width="40%" height={16} />
    </View>
  </View>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={styles.listContainer}>
    {Array.from({ length: count }, (_, index) => (
      <CardSkeleton key={index} />
    ))}
  </View>
);

// Main loading component
export const LoadingStates: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  size = 'medium',
  style,
}) => {
  switch (type) {
    case 'skeleton':
      return <CardSkeleton />;
    case 'shimmer':
      return <Shimmer width="100%" height={100} />;
    case 'spinner':
    default:
      return <LoadingSpinner size={size} />;
  }
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  shimmerContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerGradient: {
    flex: 1,
  },
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contentContainer: {
    padding: 16,
  },
  listContainer: {
    paddingVertical: 8,
  },
});

export default LoadingStates;