import React, { useState, useEffect } from 'react';

interface Vendor {
  id: string;
  name: string;
  averageScore: number;
}

const VendorPerformanceDashboard: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch('/api/maintenance/performance-reports');
        const data = await response.json();
        setVendors(data);
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
    };

    fetchVendors();
  }, []);

  return (
    <div>
      <h1>Vendor Performance Dashboard</h1>
      <table>
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Average Score</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => (
            <tr key={vendor.id}>
              <td>{vendor.name}</td>
              <td>{vendor.averageScore.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VendorPerformanceDashboard;
