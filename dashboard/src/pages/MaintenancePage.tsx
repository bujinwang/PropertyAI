import React from 'react';
import PhotoAnalysis from '../components/PhotoAnalysis';

const MaintenancePage: React.FC = () => {
  // Replace with actual maintenance request ID
  const maintenanceRequestId = "1"; 

  return (
    <div>
      <h1>Maintenance Requests</h1>
      {/* Maintenance request list will be implemented here */}
      <PhotoAnalysis maintenanceRequestId={maintenanceRequestId} />
    </div>
  );
};

export default MaintenancePage;
