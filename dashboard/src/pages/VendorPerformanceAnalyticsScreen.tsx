import React, { useState } from 'react';
import { useVendorPerformance } from '../hooks/useVendorPerformance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock vendor data - replace with API call
const vendors = [
  { id: 'clx2oy03p000008l3f0b2h5g8', name: 'PlumbPerfect' },
  { id: 'clx2oy03p000008l3f0b2h5g9', name: 'ElecSolutions' },
  { id: 'clx2oy03p000008l3f0b2h5h0', name: 'CleanSweep' },
];

const VendorPerformanceAnalyticsScreen: React.FC = () => {
  const [selectedVendor, setSelectedVendor] = useState<string>(vendors[0].id);
  const { ratings, ratingsLoading, ratingsError, averageScore, averageScoreLoading, averageScoreError } = useVendorPerformance(selectedVendor);

  const handleVendorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVendor(event.target.value);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Vendor Performance Analytics</h1>

      {/* Filtering Section */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Filters</h2>
        <div className="flex space-x-4">
          <div>
            <label htmlFor="vendor-select" className="block text-sm font-medium text-gray-700">Vendor</label>
            <select
              id="vendor-select"
              value={selectedVendor}
              onChange={handleVendorChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
              ))}
            </select>
          </div>
          {/* Add other filters for service category, time period, etc. here */}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Performance Metrics</h2>
        {(ratingsLoading || averageScoreLoading) && <p>Loading...</p>}
        {(ratingsError || averageScoreError) && <p>Error loading data</p>}
        {ratings && averageScore && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="text-lg font-semibold">Average Score</h3>
              <p className="text-3xl font-bold">{averageScore.averageScore.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="text-lg font-semibold">Total Ratings</h3>
              <p className="text-3xl font-bold">{ratings.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Ratings Chart */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Ratings Distribution</h2>
        {ratings && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ratings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metricId" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="rating" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* AI-Recommended Vendor Assignments */}
      <div>
        <h2 className="text-xl font-semibold mb-2">AI-Recommended Vendors</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          {/* Placeholder for AI recommendations */}
          <p className="text-gray-500">AI-recommended vendor assignments based on job type and performance will be shown here.</p>
        </div>
      </div>
    </div>
  );
};

export default VendorPerformanceAnalyticsScreen;
