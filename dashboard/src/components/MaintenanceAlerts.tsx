import React, { useState, useEffect } from 'react';
import AlertGroupView from './epic23/AlertGroupView';
import { predictiveMaintenanceService } from '../services/predictiveMaintenanceService';
import { AlertGroupingService } from '../../../src/services/epic23/AlertGroupingService';

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
  const [groups, setGroups] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyId || '');

  const fetchAlerts = async () => {
    if (!selectedPropertyId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await predictiveMaintenanceService.getPredictions(selectedPropertyId);
      const rawAlerts = result.predictions || []; // Adapt to alerts array
      const grouped = await AlertGroupingService.getGroupedAlerts(selectedPropertyId, { type: 'maintenance' });
      setGroups(grouped.groups);
      setAlerts(rawAlerts);
    } catch (err) {
      setError('Failed to load maintenance alerts');
      console.error('Error fetching maintenance alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchAlerts();
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
          onClick={fetchAlerts}
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

      {/* Groups */}
      {!loading && groups.length > 0 && (
        <AlertGroupView
          groups={groups}
          alerts={alerts}
          onFilterChange={(filters) => {
            // Filter maintenance alerts
            fetchAlerts(); // Re-fetch or client-side
          }}
        />
      )}

      {!loading && groups.length === 0 && selectedPropertyId && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600">No maintenance alerts available</p>
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