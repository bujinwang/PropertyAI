import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

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
  const [prediction, setPrediction] = useState<ChurnPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState(tenantId || '');

  const fetchChurnPrediction = async () => {
    if (!selectedTenantId) return;

    setLoading(true);
    setError(null);

    try {
      const response: any = await apiService.post('/analytics/predict-churn', { tenantId: selectedTenantId });
      setPrediction(response.data);
    } catch (err: any) {
      setError('Failed to load churn prediction');
      console.error('Error fetching churn prediction:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTenantId) {
      fetchChurnPrediction();
    }
  }, [selectedTenantId]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high': return 'bg-red-100 border-red-500 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low': return 'bg-green-100 border-green-500 text-green-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '✅';
      default: return '❓';
    }
  };

  if (compact && prediction) {
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(prediction.riskLevel)}`}>
        <span className="mr-2">{getRiskIcon(prediction.riskLevel)}</span>
        {prediction.churnProbability}% churn risk
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Churn Risk Assessment</h2>
        <button
          onClick={fetchChurnPrediction}
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

      {/* Prediction Results */}
      {!loading && prediction && (
        <div className="space-y-6">
          {/* Risk Summary */}
          <div className={`p-4 rounded-lg border-2 ${getRiskColor(prediction.riskLevel)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getRiskIcon(prediction.riskLevel)}</span>
                <div>
                  <h3 className="font-semibold text-lg capitalize">{prediction.riskLevel} Risk</h3>
                  <p className="text-sm opacity-75">{prediction.churnProbability}% churn probability</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Confidence</div>
                <div className="font-semibold">{prediction.confidence}%</div>
              </div>
            </div>

            {prediction.churnProbability >= 70 && (
              <div className="mt-3 bg-red-200 border border-red-300 rounded p-3">
                <p className="text-red-800 font-medium">⚠️ Immediate Action Required</p>
                <p className="text-red-700 text-sm mt-1">
                  This tenant has a high probability of churning. Consider immediate retention strategies.
                </p>
              </div>
            )}
          </div>

          {/* Risk Factors */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Risk Factors</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Late Payments</div>
                <div className="font-semibold">{prediction.riskFactors.latePayments}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Failed Payments</div>
                <div className="font-semibold">{prediction.riskFactors.failedPayments}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Overdue Invoices</div>
                <div className="font-semibold">{prediction.riskFactors.overdueInvoices}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Lease Duration</div>
                <div className="font-semibold">{prediction.riskFactors.leaseDuration} months</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Total Payments</div>
                <div className="font-semibold">{prediction.riskFactors.totalPayments}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Screening Risk</div>
                <div className="font-semibold">{prediction.riskFactors.screeningRisk ? 'High' : 'Low'}</div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {prediction.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Retention Recommendations</h4>
              <ul className="space-y-2">
                {prediction.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Last Updated */}
          <div className="text-xs text-gray-500 pt-4 border-t">
            Last updated: {new Date(prediction.lastUpdated).toLocaleString()}
          </div>
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