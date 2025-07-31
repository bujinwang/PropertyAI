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
  ]} /&gt;
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
  ]}&gt;
    <LinearGradient
      colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.shimmerGradient}
    /&gt;
  </View&gt;
);

// Loading spinner
export const LoadingSpinner: React.FC<{
  size?: 'small' | 'medium' | 'large';
  color?: string;
}> = ({ size = 'medium', color = '#007AFF' }) => {
  const getSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'medium': return 40;
      case 'large': return 60;
      default: return 40;
    }
  };

  return (
    <View style={styles.spinnerContainer}&gt;
      <ActivityIndicator size={getSize()} color={color} /&gt;
    </View&gt;
  );
};

// Card skeleton loader
export const CardSkeleton: React.FC<{ count?: number }&gt; = ({ count = 3 }) => (
  <View style={styles.cardSkeletonContainer}&gt;
    {Array.from({ length: count }).map((_, index) => (
      <View key={index} style={styles.cardSkeleton}&gt;
        <SkeletonLoader width="100%" height={120} /&gt;
        <View style={styles.cardContent}&gt;
          <SkeletonLoader width="60%" height={20} style={{ marginBottom: 8 }} /&gt;
          <SkeletonLoader width="80%" height={16} style={{ marginBottom: 4 }} /&gt;
          <SkeletonLoader width="40%" height={16} /&gt;
        </View&gt;
      </View&gt;
    ))}
  </View&gt;
);

// List skeleton loader
export const ListSkeleton: React.FC<{ count?: number }&gt; = ({ count = 5 }) => (
  <View style={styles.listSkeletonContainer}&gt;
    {Array.from({ length: count }).map((_, index) => (
      <View key={index} style={styles.listItemSkeleton}&gt;
        <SkeletonLoader width={60} height={60} borderRadius={30} /&gt;
        <View style={styles.listItemContent}&gt;
          <SkeletonLoader width="70%" height={18} style={{ marginBottom: 4 }} /&gt;
          <SkeletonLoader width="50%" height={14} /&gt;
        </View&gt;
      </View&gt;
    ))}
  </View&gt;
);

// Full screen loading state
export const FullScreenLoading: React.FC<{
  message?: string;
}> = ({ message = 'Loading...' }) => (
  <View style={styles.fullScreenContainer}&gt;
    <LoadingSpinner size="large" /&gt;
    <Text style={styles.loadingText}&gt;{message}</Text&gt;
  </View&gt;
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  shimmerContainer: {
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  shimmerGradient: {
    flex: 1,
    width: '200%',
  },
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardSkeletonContainer: {
    padding: 16,
  },
  cardSkeleton: {
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  listSkeletonContainer: {
    padding: 16,
  },
  listItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});