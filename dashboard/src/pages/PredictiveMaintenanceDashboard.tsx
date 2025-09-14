import React, { useState } from 'react';
import { predictiveMaintenanceService } from '../services/predictiveMaintenanceService';
import MaintenanceAlerts from '../components/MaintenanceAlerts';

const PredictiveMaintenanceDashboard: React.FC = () => {
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);

  const handleCreateWorkOrder = async () => {
    if (selectedPrediction) {
      try {
        await predictiveMaintenanceService.createWorkOrderFromPrediction(selectedPrediction);
        alert('Work order created successfully!');
        setSelectedPrediction(null);
      } catch (error) {
        alert('Failed to create work order.');
      }
    }
  };

  const handleAlertClick = (prediction: any) => {
    setSelectedPrediction(prediction.type);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Predictive Maintenance Dashboard</h1>

      {/* Maintenance Alerts Section */}
      <MaintenanceAlerts onAlertClick={handleAlertClick} />

      {/* Filtering Section */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Placeholder for property filter */}
          <div>
            <label htmlFor="property-filter" className="block text-sm font-medium text-gray-700">Property</label>
            <select id="property-filter" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
              <option>All Properties</option>
            </select>
          </div>
          {/* Placeholder for system filter */}
          <div>
            <label htmlFor="system-filter" className="block text-sm font-medium text-gray-700">Building System</label>
            <select id="system-filter" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
              <option>All Systems</option>
            </select>
          </div>
          {/* Placeholder for urgency filter */}
          <div>
            <label htmlFor="urgency-filter" className="block text-sm font-medium text-gray-700">Urgency</label>
            <select id="urgency-filter" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
              <option>All Urgencies</option>
            </select>
          </div>
          {/* Placeholder for cost filter */}
          <div>
            <label htmlFor="cost-range-filter" className="block text-sm font-medium text-gray-700">Cost Range</label>
            <input type="range" id="cost-range-filter" className="w-full" />
          </div>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Maintenance Timeline</h2>
        {/* Placeholder for timeline component */}
        <div className="bg-gray-200 h-40 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Timeline visualization will be implemented here.</p>
        </div>
      </div>

      {/* Cost Projections */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Cost Projections</h2>
        {/* Placeholder for chart component */}
        <div className="bg-gray-200 h-60 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Cost projection charts will be implemented here.</p>
        </div>
      </div>

      {/* Maintenance History */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Maintenance History</h2>
        {/* Placeholder for history table */}
        <div className="bg-gray-200 p-4 rounded-lg">
          <p className="text-gray-500">Maintenance history with pattern recognition will be implemented here.</p>
        </div>
      </div>

      {/* Convert to Work Order */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Convert to Work Order</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="mb-4">Select a predicted maintenance item from the timeline or history to convert it into a work order.</p>
          <button
            onClick={handleCreateWorkOrder}
            disabled={!selectedPrediction}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            Create Work Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default PredictiveMaintenanceDashboard;
