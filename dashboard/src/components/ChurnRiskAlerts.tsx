import React, { useState, useEffect } from 'react';
import AlertGroupView from './epic23/AlertGroupView';
import { apiService } from '../services/apiService';
import { AlertGroupingService } from '../../../src/services/epic23/AlertGroupingService';

interface ChurnPrediction {
  tenantId: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  confidence: number;
  riskFactors: {
    latePayments: number;
    failedPayments: number;
    overdueInvoices: number;
    totalPayments: number;
    totalInvoices: number;
    leaseDuration: number;
    screeningRisk: number;
  };
  recommendations: string[];
  lastUpdated: string;
  message?: string;
  error?: string;
}

interface ChurnRiskAlertsProps {
  tenantId?: string;
  onAlertClick?: (prediction: ChurnPrediction) => void;
  compact?: boolean;
}

const ChurnRiskAlerts: React.FC<ChurnRiskAlertsProps> = ({
  tenantId,
  onAlertClick,
  compact = false
}) => {
  const [groups, setGroups] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState(tenantId || '');

  const fetchAlerts = async () => {
    if (!selectedTenantId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch raw alerts (adapt to churn API)
      const response: any = await apiService.post('/analytics/predict-churn', { tenantId: selectedTenantId });
      const rawAlerts = response.data.predictions || []; // Adapt to array of alerts
      const grouped = await AlertGroupingService.getGroupedAlerts(selectedTenantId, { type: 'churn' }); // Adapt for tenant
      setGroups(grouped.groups);
      setAlerts(rawAlerts);
    } catch (err: any) {
      setError('Failed to load churn alerts');
      console.error('Error fetching churn alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTenantId) {
      fetchAlerts();
    }
  }, [selectedTenantId]);

  if (compact) {
    return (
      <AlertGroupView compact groups={groups} alerts={alerts} />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Churn Risk Assessment</h2>
        <button
          onClick={fetchAlerts}
          disabled={loading || !selectedTenantId}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm"
        >
          {loading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {/* Tenant Selection */}
      <div className="mb-4">
        <label htmlFor="tenant-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Tenant
        </label>
        <input
          id="tenant-select"
          type="text"
          value={selectedTenantId}
          onChange={(e) => setSelectedTenantId(e.target.value)}
          placeholder="Enter Tenant ID"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Analyzing tenant data for churn risk...</p>
        </div>
      )}

      {/* Groups */}
      {!loading && groups.length > 0 && (
        <AlertGroupView
          groups={groups}
          alerts={alerts}
          onFilterChange={(filters) => {
            // Filter churn alerts by filters
            fetchAlerts(); // Re-fetch with filters if needed, or client-side
          }}
        />
      )}

      {!loading && groups.length === 0 && selectedTenantId && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600">No churn alerts available</p>
          <p className="text-sm text-gray-500 mt-1">
            Either no tenant data or insufficient patterns detected
          </p>
        </div>
      )}

      {/* No Tenant Selected */}
      {!selectedTenantId && (
        <div className="text-center py-8">
          <p className="text-gray-600">Please select a tenant to view churn risk assessment</p>
        </div>
      )}
    </div>
  );
};

export default ChurnRiskAlerts;