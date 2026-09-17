import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OccupancyForecastResponse } from '../../services/mlPredictionService';

interface OccupancyForecastCardProps {
  forecast: OccupancyForecastResponse;
  propertyName: string;
}

export const OccupancyForecastCard: React.FC<OccupancyForecastCardProps> = ({
  forecast,
  propertyName,
}) => {
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getTrendColor = (current: number, forecast: number) => {
    if (forecast > current) return '#4CAF50';
    if (forecast < current) return '#F44336';
    return '#757575';
  };

  const getTrendIcon = (current: number, forecast: number) => {
    if (forecast > current) return '↑';
    if (forecast < current) return '↓';
    return '→';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.propertyName}>{propertyName}</Text>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>
            {(forecast.confidence * 100).toFixed(0)}% Confidence
          </Text>
        </View>
      </View>

      <View style={styles.forecastSection}>
        <View style={styles.forecastItem}>
          <Text style={styles.forecastLabel}>Next Month</Text>
          <Text style={styles.forecastValue}>
            {formatPercentage(forecast.nextMonthForecast)}
          </Text>
          <Text
            style={[
              styles.trend,
              { color: getTrendColor(0.92, forecast.nextMonthForecast) },
            ]}
          >
            {getTrendIcon(0.92, forecast.nextMonthForecast)} from current
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.forecastItem}>
          <Text style={styles.forecastLabel}>Next Quarter</Text>
          <Text style={styles.forecastValue}>
            {formatPercentage(forecast.nextQuarterForecast)}
          </Text>
          <Text
            style={[
              styles.trend,
              { color: getTrendColor(0.92, forecast.nextQuarterForecast) },
            ]}
          >
            {getTrendIcon(0.92, forecast.nextQuarterForecast)} from current
          </Text>
        </View>
      </View>

      {forecast.trends && forecast.trends.length > 0 && (
        <View style={styles.trendsSection}>
          <Text style={styles.sectionTitle}>Trend Analysis</Text>
          {forecast.trends.slice(0, 3).map((trend, index) => (
            <View key={index} style={styles.trendItem}>
              <View style={styles.trendHeader}>
                <Text style={styles.trendPeriod}>{trend.period}</Text>
                <Text style={styles.trendForecast}>
                  {formatPercentage(trend.forecast)}
                </Text>
              </View>
              {trend.factors && trend.factors.length > 0 && (
                <View style={styles.factorsContainer}>
                  {trend.factors.map((factor, idx) => (
                    <View key={idx} style={styles.factorChip}>
                      <Text style={styles.factorText}>{factor}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {forecast.recommendations && forecast.recommendations.length > 0 && (
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {forecast.recommendations.map((rec, index) => (
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
  confidenceBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1976D2',
  },
  forecastSection: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  forecastItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  forecastLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
  },
  forecastValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 4,
  },
  trend: {
    fontSize: 12,
    fontWeight: '500',
  },
  trendsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  trendItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendPeriod: {
    fontSize: 13,
    fontWeight: '500',
    color: '#424242',
  },
  trendForecast: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  factorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  factorChip: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  factorText: {
    fontSize: 11,
    color: '#616161',
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
