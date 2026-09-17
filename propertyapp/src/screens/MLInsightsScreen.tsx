import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { mlPredictionService } from '../services/mlPredictionService';
import { ChurnRiskCard } from '../components/ml/ChurnRiskCard';
import { MaintenancePredictionCard } from '../components/ml/MaintenancePredictionCard';
import { OccupancyForecastCard } from '../components/ml/OccupancyForecastCard';
import { RentOptimizationCard } from '../components/ml/RentOptimizationCard';
import { api } from '../services/api';
import { ENDPOINTS } from '../constants/api';

interface ChurnPredictionWithName {
  prediction: string;
  probability: number;
  confidence: number;
  factors: Array<{ name: string; impact: number; description: string }>;
  recommendations: string[];
  tenantName: string;
}

interface MaintenancePredictionWithName {
  predictedCost: number;
  costRange: { min: number; max: number };
  confidence: number;
  breakdown: Array<{ category: string; predictedCost: number; probability: number; urgency: string }>;
  recommendations: string[];
  timeline: string;
  propertyName: string;
}

interface OccupancyForecastWithName {
  nextMonthForecast: number;
  nextQuarterForecast: number;
  confidence: number;
  trends: Array<{ period: string; forecast: number; factors: string[] }>;
  recommendations: string[];
  propertyName: string;
}

interface RentOptimizationWithName {
  recommendedRent: number;
  currentMarketPosition: 'below' | 'at' | 'above';
  adjustmentPercentage: number;
  confidence: number;
  marketAnalysis: {
    avgMarketRent: number;
    competitorRange: { min: number; max: number };
    demandLevel: 'low' | 'medium' | 'high';
  };
  recommendations: string[];
  propertyName: string;
  currentRent: number;
}

export const MLInsightsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'churn' | 'maintenance' | 'occupancy' | 'rent'>('churn');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [churnPredictions, setChurnPredictions] = useState<ChurnPredictionWithName[]>([]);
  const [maintenancePredictions, setMaintenancePredictions] = useState<MaintenancePredictionWithName[]>([]);
  const [occupancyForecasts, setOccupancyForecasts] = useState<OccupancyForecastWithName[]>([]);
  const [rentOptimizations, setRentOptimizations] = useState<RentOptimizationWithName[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPredictions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'churn') {
        await loadChurnPredictions();
      } else if (activeTab === 'maintenance') {
        await loadMaintenancePredictions();
      } else if (activeTab === 'occupancy') {
        await loadOccupancyForecasts();
      } else {
        await loadRentOptimizations();
      }
    } catch (err) {
      console.error('Error loading predictions:', err);
      setError('Failed to load predictions. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadChurnPredictions = async () => {
    try {
      // Fetch real lease data from backend
      const leasesResponse = await api.get<any>(ENDPOINTS.LEASES.LIST);
      const leases = leasesResponse.leases || leasesResponse || [];
      
      // Filter active leases
      const activeLeases = leases.filter((lease: any) => 
        lease.status === 'ACTIVE' || lease.status === 'active'
      );
      
      if (activeLeases.length === 0) {
        // Fall back to mock data if no active leases
        setChurnPredictions([]); 
        return;
      }
      
      // Generate predictions for each active lease/tenant
      const predictions = await Promise.all(
        activeLeases.slice(0, 10).map(async (lease: any) => {
          try {
            // Calculate lease months remaining
            const endDate = new Date(lease.endDate);
            const now = new Date();
            const monthsRemaining = Math.max(0, Math.round((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
            
            // Get tenant name
            const tenantName = lease.tenant?.firstName 
              ? `${lease.tenant.firstName} ${lease.tenant.lastName || ''}`.trim()
              : lease.tenantId || 'Tenant';
            
            // Predict churn risk
            const prediction = await mlPredictionService.predictChurnRisk({
              tenantId: lease.tenantId || lease.id,
              paymentHistory: {
                onTimePayments: 20, // Default values - would need actual payment data
                latePayments: 4,
                totalPayments: 24,
              },
              maintenanceRequests: 3, // Default - would need actual maintenance request count
              leaseMonthsRemaining: monthsRemaining,
              communicationFrequency: 5, // Default
            });
            
            return { ...prediction, tenantName };
          } catch (error) {
            console.error(`Error predicting churn for lease ${lease.id}:`, error);
            return null;
          }
        })
      );
      
      // Filter out null results
      setChurnPredictions(predictions.filter(p => p !== null) as ChurnPredictionWithName[]);
    } catch (error) {
      console.error('Error loading churn predictions:', error);
      // Fall back to empty state
      setChurnPredictions([]);
    }
  };

  const loadMaintenancePredictions = async () => {
    try {
      // Fetch real rental data from backend
      const rentalsResponse = await api.get<any>(ENDPOINTS.RENTALS.LIST);
      const rentals = rentalsResponse.rentals || rentalsResponse || [];
      
      if (rentals.length === 0) {
        setMaintenancePredictions([]);
        return;
      }
      
      // Generate predictions for each rental
      const predictions = await Promise.all(
        rentals.slice(0, 10).map(async (rental: any) => {
          try {
            // Calculate property age
            const yearBuilt = rental.yearBuilt || 2010;
            const propertyAge = new Date().getFullYear() - yearBuilt;
            
            // Get rental name
            const propertyName = rental.name || rental.address || `Rental ${rental.id.substring(0, 8)}`;
            
            // Predict maintenance costs
            const prediction = await mlPredictionService.predictMaintenanceCosts({
              rentalId: rental.id,
              propertyAge,
              propertyType: rental.type || 'apartment',
              squareFeet: rental.squareFeet || 1200,
              lastMaintenanceDate: new Date().toISOString().split('T')[0],
              maintenanceHistory: [], // Would need actual maintenance history
              systems: {
                hvac: { age: Math.min(propertyAge, 12), lastService: new Date().toISOString().split('T')[0] },
                plumbing: { age: propertyAge, lastService: new Date().toISOString().split('T')[0] },
                electrical: { age: Math.min(propertyAge, 15), lastService: new Date().toISOString().split('T')[0] },
                roof: { age: Math.min(propertyAge, 10), lastService: new Date().toISOString().split('T')[0] },
              },
            });
            
            return { ...prediction, propertyName };
          } catch (error) {
            console.error(`Error predicting maintenance for rental ${rental.id}:`, error);
            return null;
          }
        })
      );
      
      // Filter out null results
      setMaintenancePredictions(predictions.filter(p => p !== null) as MaintenancePredictionWithName[]);
    } catch (error) {
      console.error('Error loading maintenance predictions:', error);
      setMaintenancePredictions([]);
    }
  };

  const loadOccupancyForecasts = async () => {
    // Mock occupancy forecast data
    const forecasts = [
      {
        propertyName: 'Sunset Apartments',
        nextMonthForecast: 0.94,
        nextQuarterForecast: 0.96,
        confidence: 0.87,
        trends: [
          {
            period: 'Next Month',
            forecast: 0.94,
            factors: ['Seasonal demand', 'Recent renovations'],
          },
        ],
        recommendations: ['Consider slight rent increase', 'Market property online'],
      },
    ];
    setOccupancyForecasts(forecasts);
  };

  const loadRentOptimizations = async () => {
    // Mock rent optimization data
    const optimizations = [
      {
        propertyName: 'Sunset Apartments #101',
        currentRent: 1800,
        recommendedRent: 1950,
        currentMarketPosition: 'below' as const,
        adjustmentPercentage: 8.3,
        confidence: 0.82,
        marketAnalysis: {
          avgMarketRent: 2000,
          competitorRange: { min: 1850, max: 2150 },
          demandLevel: 'high' as const,
        },
        recommendations: [
          'Increase rent to match market rate',
          'Highlight recent upgrades in listing',
        ],
      },
    ];
    setRentOptimizations(optimizations);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPredictions();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ML Insights</Text>
        <Text style={styles.subtitle}>AI-powered predictions for your properties</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'churn' && styles.activeTab]}
          onPress={() => setActiveTab('churn')}
        >
          <Text style={[styles.tabText, activeTab === 'churn' && styles.activeTabText]}>
            Churn Risk
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'maintenance' && styles.activeTab]}
          onPress={() => setActiveTab('maintenance')}
        >
          <Text style={[styles.tabText, activeTab === 'maintenance' && styles.activeTabText]}>
            Maintenance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'occupancy' && styles.activeTab]}
          onPress={() => setActiveTab('occupancy')}
        >
          <Text style={[styles.tabText, activeTab === 'occupancy' && styles.activeTabText]}>
            Occupancy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rent' && styles.activeTab]}
          onPress={() => setActiveTab('rent')}
        >
          <Text style={[styles.tabText, activeTab === 'rent' && styles.activeTabText]}>
            Rent Pricing
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1976D2" />
            <Text style={styles.loadingText}>Loading predictions...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadPredictions}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {activeTab === 'churn' && (
              <View>
                {churnPredictions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No churn predictions available</Text>
                  </View>
                ) : (
                  churnPredictions.map((prediction, index) => (
                    <ChurnRiskCard
                      key={index}
                      prediction={prediction}
                      tenantName={prediction.tenantName}
                    />
                  ))
                )}
              </View>
            )}

            {activeTab === 'maintenance' && (
              <View>
                {maintenancePredictions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No maintenance predictions available</Text>
                  </View>
                ) : (
                  maintenancePredictions.map((prediction, index) => (
                    <MaintenancePredictionCard
                      key={index}
                      prediction={prediction}
                      propertyName={prediction.propertyName}
                    />
                  ))
                )}
              </View>
            )}

            {activeTab === 'occupancy' && (
              <View>
                {occupancyForecasts.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No occupancy forecasts available</Text>
                  </View>
                ) : (
                  occupancyForecasts.map((forecast, index) => (
                    <OccupancyForecastCard
                      key={index}
                      forecast={forecast}
                      propertyName={forecast.propertyName}
                    />
                  ))
                )}
              </View>
            )}

            {activeTab === 'rent' && (
              <View>
                {rentOptimizations.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No rent optimizations available</Text>
                  </View>
                ) : (
                  rentOptimizations.map((optimization, index) => (
                    <RentOptimizationCard
                      key={index}
                      optimization={optimization}
                      propertyName={optimization.propertyName}
                      currentRent={optimization.currentRent}
                    />
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexGrow: 0,
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minWidth: 100,
  },
  activeTab: {
    borderBottomColor: '#1976D2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  activeTabText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#757575',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
  },
});
