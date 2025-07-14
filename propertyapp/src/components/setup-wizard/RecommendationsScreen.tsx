import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import setupWizardService, { AIRecommendation, AIRecommendationRequest } from '../../services/setupWizardService';
import RecommendationCard from './RecommendationCard';
import { UserRole } from '../../types/auth';
import { CommunicationPreference } from './CommunicationPreferences';

interface RecommendationsScreenProps {
  category: 'notifications' | 'privacy' | 'features';
  role: UserRole;
  portfolioSize?: { properties: number; units: number };
  communicationPreference?: CommunicationPreference;
  onUpdateRecommendations: (recommendations: AIRecommendation[]) => void;
}

const RecommendationsScreen: React.FC<RecommendationsScreenProps> = ({
  category,
  role,
  portfolioSize,
  communicationPreference,
  onUpdateRecommendations,
}) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let result: AIRecommendation[] = [];
        let request: AIRecommendationRequest;
        
        switch (category) {
          case 'notifications':
            result = await setupWizardService.getNotificationRecommendations(role, portfolioSize);
            break;
          case 'privacy':
            result = await setupWizardService.getPrivacyRecommendations(role);
            break;
          case 'features':
            request = {
              role,
              portfolioSize,
              communicationPreference,
            };
            result = await setupWizardService.getFeatureRecommendations(request);
            break;
        }
        
        setRecommendations(result);
        onUpdateRecommendations(result); // Notify parent component
      } catch (err) {
        setError('Failed to load recommendations. Please try again.');
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [category, role, portfolioSize, communicationPreference]);

  const handleToggleRecommendation = (id: string, enabled: boolean) => {
    const updatedRecommendations = recommendations.map(rec => 
      rec.id === id ? { ...rec, enabled } : rec
    );
    
    setRecommendations(updatedRecommendations);
    onUpdateRecommendations(updatedRecommendations); // Notify parent component
  };

  // Determine title based on category
  const getTitle = () => {
    switch (category) {
      case 'notifications':
        return 'Notification Preferences';
      case 'privacy':
        return 'Privacy Recommendations';
      case 'features':
        return 'Recommended Features';
      default:
        return 'Recommendations';
    }
  };

  // Get description based on category
  const getDescription = () => {
    switch (category) {
      case 'notifications':
        return 'Personalized notification settings based on your role and preferences';
      case 'privacy':
        return 'Privacy settings tailored to protect your data while enabling essential features';
      case 'features':
        return 'AI-recommended features based on your role, portfolio size, and communication preferences';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3182ce" />
        <Text style={styles.loadingText}>
          AI is generating personalized recommendations...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            // Re-trigger the useEffect
            setRecommendations([]);
            setLoading(true);
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getTitle()}</Text>
      <Text style={styles.subtitle}>{getDescription()}</Text>
      
      <FlatList
        data={recommendations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecommendationCard
            recommendation={item}
            onToggle={handleToggleRecommendation}
          />
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    color: '#4a5568',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e53e3e',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3182ce',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RecommendationsScreen;