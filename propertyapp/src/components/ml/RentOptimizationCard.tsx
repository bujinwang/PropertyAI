import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RentOptimizationResponse } from '../../services/mlPredictionService';

interface RentOptimizationCardProps {
  optimization: RentOptimizationResponse;
  propertyName: string;
  currentRent: number;
}

export const RentOptimizationCard: React.FC<RentOptimizationCardProps> = ({
  optimization,
  propertyName,
  currentRent,
}) => {
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'below':
        return '#4CAF50';
      case 'at':
        return '#FF9800';
      case 'above':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'below':
        return 'Below Market';
      case 'at':
        return 'At Market Rate';
      case 'above':
        return 'Above Market';
      default:
        return 'Unknown';
    }
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'high':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const rentDifference = optimization.recommendedRent - currentRent;
  const isIncrease = rentDifference > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.propertyName}>{propertyName}</Text>
        <View
          style={[
            styles.positionBadge,
            { backgroundColor: getPositionColor(optimization.currentMarketPosition) },
          ]}
        >
          <Text style={styles.positionText}>
            {getPositionLabel(optimization.currentMarketPosition)}
          </Text>
        </View>
      </View>

      <View style={styles.rentSection}>
        <View style={styles.currentRentContainer}>
          <Text style={styles.label}>Current Rent</Text>
          <Text style={styles.currentRent}>{formatCurrency(currentRent)}</Text>
        </View>

        <View style={styles.arrowContainer}>
          <Text style={[styles.arrow, { color: isIncrease ? '#4CAF50' : '#F44336' }]}>
            {isIncrease ? '→' : '←'}
          </Text>
        </View>

        <View style={styles.recommendedRentContainer}>
          <Text style={styles.label}>Recommended</Text>
          <Text style={styles.recommendedRent}>
            {formatCurrency(optimization.recommendedRent)}
          </Text>
          <Text
            style={[
              styles.difference,
              { color: isIncrease ? '#4CAF50' : '#F44336' },
            ]}
          >
            {isIncrease ? '+' : ''}
            {formatCurrency(rentDifference)} ({optimization.adjustmentPercentage > 0 ? '+' : ''}
            {optimization.adjustmentPercentage.toFixed(1)}%)
          </Text>
        </View>
      </View>

      <View style={styles.confidenceBar}>
        <View style={[styles.confidenceFill, { width: `${optimization.confidence * 100}%` }]} />
      </View>
      <Text style={styles.confidenceText}>
        {(optimization.confidence * 100).toFixed(0)}% Confidence
      </Text>

      {optimization.marketAnalysis && (
        <View style={styles.marketSection}>
          <Text style={styles.sectionTitle}>Market Analysis</Text>
          
          <View style={styles.marketRow}>
            <View style={styles.marketItem}>
              <Text style={styles.marketLabel}>Avg Market Rent</Text>
              <Text style={styles.marketValue}>
                {formatCurrency(optimization.marketAnalysis.avgMarketRent)}
              </Text>
            </View>
            
            <View style={styles.marketItem}>
              <Text style={styles.marketLabel}>Demand Level</Text>
              <View style={styles.demandContainer}>
                <View
                  style={[
                    styles.demandDot,
                    { backgroundColor: getDemandColor(optimization.marketAnalysis.demandLevel) },
                  ]}
                />
                <Text
                  style={[
                    styles.demandText,
                    { color: getDemandColor(optimization.marketAnalysis.demandLevel) },
                  ]}
                >
                  {optimization.marketAnalysis.demandLevel.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.rangeContainer}>
            <Text style={styles.rangeLabel}>Competitor Range</Text>
            <Text style={styles.rangeValue}>
              {formatCurrency(optimization.marketAnalysis.competitorRange.min)} -{' '}
              {formatCurrency(optimization.marketAnalysis.competitorRange.max)}
            </Text>
          </View>
        </View>
      )}

      {optimization.recommendations && optimization.recommendations.length > 0 && (
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {optimization.recommendations.map((rec, index) => (
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
  positionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  positionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  currentRentContainer: {
    alignItems: 'center',
    flex: 1,
  },
  recommendedRentContainer: {
    alignItems: 'center',
    flex: 1,
  },
  arrowContainer: {
    paddingHorizontal: 8,
  },
  arrow: {
    fontSize: 24,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    color: '#757575',
    marginBottom: 4,
  },
  currentRent: {
    fontSize: 20,
    fontWeight: '600',
    color: '#424242',
  },
  recommendedRent: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1976D2',
  },
  difference: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
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
    textAlign: 'center',
    marginBottom: 16,
  },
  marketSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  marketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  marketItem: {
    flex: 1,
  },
  marketLabel: {
    fontSize: 11,
    color: '#757575',
    marginBottom: 4,
  },
  marketValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  demandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  demandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  demandText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rangeContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  rangeLabel: {
    fontSize: 11,
    color: '#757575',
    marginBottom: 4,
  },
  rangeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
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
