import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaintenancePredictionResponse } from '../../services/mlPredictionService';

interface MaintenancePredictionCardProps {
  prediction: MaintenancePredictionResponse;
  propertyName: string;
}

export const MaintenancePredictionCard: React.FC<MaintenancePredictionCardProps> = ({
  prediction,
  propertyName,
}) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
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

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.propertyName}>{propertyName}</Text>
        <Text style={styles.timeline}>{prediction.timeline}</Text>
      </View>

      <View style={styles.costSection}>
        <Text style={styles.costLabel}>Predicted Maintenance Cost</Text>
        <Text style={styles.costValue}>{formatCurrency(prediction.predictedCost)}</Text>
        <Text style={styles.costRange}>
          Range: {formatCurrency(prediction.costRange.min)} - {formatCurrency(prediction.costRange.max)}
        </Text>
        <View style={styles.confidenceBar}>
          <View style={[styles.confidenceFill, { width: `${prediction.confidence * 100}%` }]} />
        </View>
        <Text style={styles.confidenceText}>
          {(prediction.confidence * 100).toFixed(0)}% Confidence
        </Text>
      </View>

      {prediction.breakdown && prediction.breakdown.length > 0 && (
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Cost Breakdown</Text>
          {prediction.breakdown.map((item, index) => (
            <View key={index} style={styles.breakdownItem}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.categoryName}>{item.category}</Text>
                <View
                  style={[
                    styles.urgencyBadge,
                    { backgroundColor: getUrgencyColor(item.urgency) },
                  ]}
                >
                  <Text style={styles.urgencyText}>{item.urgency.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.breakdownStats}>
                <Text style={styles.breakdownCost}>{formatCurrency(item.predictedCost)}</Text>
                <Text style={styles.probability}>
                  {(item.probability * 100).toFixed(0)}% probability
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {prediction.recommendations && prediction.recommendations.length > 0 && (
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {prediction.recommendations.map((rec, index) => (
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
  propertyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  timeline: {
    fontSize: 12,
    color: '#757575',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  costSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  costLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  costValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 4,
  },
  costRange: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 12,
  },
  confidenceBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#1976D2',
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 11,
    color: '#757575',
  },
  breakdownSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  breakdownItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  breakdownStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownCost: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  probability: {
    fontSize: 12,
    color: '#757575',
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
