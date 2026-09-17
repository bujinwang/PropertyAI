import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChurnPredictionResponse } from '../../services/mlPredictionService';

interface ChurnRiskCardProps {
  prediction: ChurnPredictionResponse;
  tenantName: string;
}

export const ChurnRiskCard: React.FC<ChurnRiskCardProps> = ({ prediction, tenantName }) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'high':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'Low Risk';
      case 'medium':
        return 'Medium Risk';
      case 'high':
        return 'High Risk';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tenantName}>{tenantName}</Text>
        <View
          style={[styles.riskBadge, { backgroundColor: getRiskColor(prediction.prediction) }]}
        >
          <Text style={styles.riskBadgeText}>{getRiskLabel(prediction.prediction)}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Churn Probability</Text>
          <Text style={styles.statValue}>{(prediction.probability * 100).toFixed(1)}%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Confidence</Text>
          <Text style={styles.statValue}>{(prediction.confidence * 100).toFixed(1)}%</Text>
        </View>
      </View>

      {prediction.factors && prediction.factors.length > 0 && (
        <View style={styles.factorsSection}>
          <Text style={styles.sectionTitle}>Key Factors</Text>
          {prediction.factors.slice(0, 3).map((factor, index) => (
            <View key={index} style={styles.factorItem}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorName}>{factor.name}</Text>
                <Text
                  style={[
                    styles.factorImpact,
                    { color: factor.impact > 0 ? '#F44336' : '#4CAF50' },
                  ]}
                >
                  {factor.impact > 0 ? '+' : ''}
                  {(factor.impact * 100).toFixed(0)}%
                </Text>
              </View>
              <Text style={styles.factorDescription}>{factor.description}</Text>
            </View>
          ))}
        </View>
      )}

      {prediction.recommendations && prediction.recommendations.length > 0 && (
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {prediction.recommendations.slice(0, 2).map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tenantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  riskBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  factorsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  factorItem: {
    marginBottom: 12,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  factorName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#424242',
  },
  factorImpact: {
    fontSize: 13,
    fontWeight: '600',
  },
  factorDescription: {
    fontSize: 12,
    color: '#757575',
    lineHeight: 16,
  },
  recommendationsSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#1976D2',
    marginRight: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    color: '#424242',
    lineHeight: 18,
  },
});
