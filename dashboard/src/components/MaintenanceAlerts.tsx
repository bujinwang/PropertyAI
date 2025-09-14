import React, { useState, useEffect } from 'react';
import { predictiveMaintenanceService } from '../services/predictiveMaintenanceService';

interface MaintenancePrediction {
  type: string;
  predictedDate: string;
  confidence: number;
  estimatedCost: number;
  priority: string;
  reason: string;
}

interface MaintenanceAlertsProps {
  propertyId?: string;
  onAlertClick?: (prediction: MaintenancePrediction) => void;
}

const MaintenanceAlerts: React.FC<MaintenanceAlertsProps> = ({
  propertyId,
  onAlertClick
}) => {
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyId || '');

  const fetchPredictions = async () => {
    if (!selectedPropertyId) return;

    setLoading(true);
    setError(null);

    try {
      const result: any = await predictiveMaintenanceService.getPredictions(selectedPropertyId);
      setPredictions(result.predictions || []);
    } catch (err) {
      setError('Failed to load maintenance predictions');
      console.error('Error fetching predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchPredictions();
    }
  }, [selectedPropertyId]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 border-red-500 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low': return 'bg-green-100 border-green-500 text-green-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    const predictedDate = new Date(dateString);
    const diffTime = predictedDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Maintenance Alerts</h2>
        <button
          onClick={fetchPredictions}
          disabled={loading || !selectedPropertyId}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Property Selection */}
      <div className="mb-4">
        <label htmlFor="property-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Property
        </label>
        <input
          id="property-select"
          type="text"
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          placeholder="Enter Property ID"
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
          <p className="text-gray-600 mt-2">Loading maintenance predictions...</p>
        </div>
      )}

      {/* Predictions List */}
      {!loading && predictions.length > 0 && (
        <div className="space-y-4">
          {predictions.map((prediction, index) => {
            const daysUntil = getDaysUntil(prediction.predictedDate);
            const isUrgent = daysUntil <= 30;

            return (
              <div
                key={index}
                className={`border-l-4 p-4 rounded-r-lg cursor-pointer transition-all hover:shadow-md ${
                  isUrgent ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'
                }`}
                onClick={() => onAlertClick?.(prediction)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 capitalize">
                      {prediction.type.replace('_', ' ')} Maintenance
                    </h3>
                    <p className="text-sm text-gray-600">{prediction.reason}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(prediction.priority)}`}>
                      {prediction.priority.toUpperCase()}
                    </span>
                    <span className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                      {prediction.confidence}% confidence
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">Predicted: </span>
                    <span className={isUrgent ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                      {formatDate(prediction.predictedDate)} ({daysUntil} days)
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Est. Cost: </span>
                    <span className="text-gray-700">${prediction.estimatedCost.toLocaleString()}</span>
                  </div>
                </div>

                {isUrgent && (
                  <div className="mt-2 bg-red-100 border border-red-300 rounded p-2">
                    <p className="text-red-800 text-sm font-medium">
                      ⚠️ Urgent: Maintenance due within 30 days
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* No Predictions */}
      {!loading && predictions.length === 0 && selectedPropertyId && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600">No maintenance predictions available</p>
          <p className="text-sm text-gray-500 mt-1">
            Either no historical data or insufficient patterns detected
          </p>
        </div>
      )}

      {/* No Property Selected */}
      {!selectedPropertyId && (
        <div className="text-center py-8">
          <p className="text-gray-600">Please select a property to view maintenance alerts</p>
        </div>
      )}
    </div>
  );
};

export default MaintenanceAlerts;