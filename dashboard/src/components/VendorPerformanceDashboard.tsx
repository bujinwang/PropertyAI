import React, { useState, useEffect } from 'react';
import VendorPaymentModal from './VendorPaymentModal';

interface Vendor {
  id: string;
  name: string;
  averageScore: number;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  processedAt: string;
  workOrderId: string;
}

interface WorkOrder {
  id: string;
  status: string;
  cost: number;
}

const VendorPerformanceDashboard: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

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

  const handleViewHistory = async (vendor: Vendor) => {
    setSelectedVendor(vendor);
    try {
      const [paymentsRes, workOrdersRes] = await Promise.all([
        fetch(`/api/vendor-payments/history/${vendor.id}`),
        fetch(`/api/work-orders?vendorId=${vendor.id}`),
      ]);
      const paymentsData = await paymentsRes.json();
      const workOrdersData = await workOrdersRes.json();
      setPaymentHistory(paymentsData);
      setWorkOrders(workOrdersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handlePaymentSuccess = () => {
    setSelectedWorkOrder(null);
    if (selectedVendor) {
      handleViewHistory(selectedVendor);
    }
  };

  return (
    <div>
      <h1>Vendor Performance Dashboard</h1>
      <table>
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Average Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => (
            <tr key={vendor.id}>
              <td>{vendor.name}</td>
              <td>{vendor.averageScore.toFixed(2)}</td>
              <td>
                <button onClick={() => handleViewHistory(vendor)}>View Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedVendor && (
        <div>
          <h2>Details for {selectedVendor.name}</h2>
          <h3>Work Orders</h3>
          <table>
            <thead>
              <tr>
                <th>Work Order ID</th>
                <th>Status</th>
                <th>Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((workOrder) => (
                <tr key={workOrder.id}>
                  <td>{workOrder.id}</td>
                  <td>{workOrder.status}</td>
                  <td>${workOrder.cost.toFixed(2)}</td>
                  <td>
                    {workOrder.status === 'COMPLETED' && (
                      <button onClick={() => setSelectedWorkOrder(workOrder)}>Pay</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Payment History</h3>
          <table>
            <thead>
              <tr>
                <th>Work Order ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.workOrderId}</td>
                  <td>${payment.amount.toFixed(2)}</td>
                  <td>{payment.status}</td>
                  <td>{new Date(payment.processedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedWorkOrder && selectedVendor && (
        <VendorPaymentModal
          workOrderId={selectedWorkOrder.id}
          vendorName={selectedVendor.name}
          amount={selectedWorkOrder.cost}
          onClose={() => setSelectedWorkOrder(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default VendorPerformanceDashboard;
