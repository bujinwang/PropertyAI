import React from 'react';
import PhotoAnalysis from '../components/PhotoAnalysis';
import QuoteList from '../components/quotes/QuoteList';

const MaintenancePage: React.FC = () => {
  // Replace with actual maintenance request ID
  const maintenanceRequestId = "1";
  // Replace with actual work order ID
  const workOrderId = "1";

  return (
    <div>
      <h1>Maintenance Requests</h1>
      {/* Maintenance request list will be implemented here */}
      <PhotoAnalysis maintenanceRequestId={maintenanceRequestId} />
      <QuoteList workOrderId={workOrderId} />
    </div>
  );
};

export default MaintenancePage;
