import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
}

interface VendorPayment {
  id: string;
  amount: number;
  notes: string;
}

const PaymentApproval: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>([]);

  useEffect(() => {
    const fetchPendingPayments = async () => {
      try {
        const [transactionsRes, vendorPaymentsRes] = await Promise.all([
          api.get('/api/transactions/pending'),
          api.get('/api/vendor-payments/pending'),
        ]);
        setTransactions(transactionsRes.data);
        setVendorPayments(vendorPaymentsRes.data);
      } catch (error) {
        console.error('Error fetching pending payments:', error);
      }
    };

    fetchPendingPayments();
  }, []);

  const handleApproveTransaction = async (id: string) => {
    try {
      await api.post(`/api/payments/transactions/${id}/approve`);
      setTransactions(transactions.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error approving transaction:', error);
    }
  };

  const handleRejectTransaction = async (id: string) => {
    try {
      await api.post(`/api/payments/transactions/${id}/reject`);
      setTransactions(transactions.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error rejecting transaction:', error);
    }
  };

  const handleApproveVendorPayment = async (id: string) => {
    try {
      await api.post(`/api/payments/vendor-payments/${id}/approve`);
      setVendorPayments(vendorPayments.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error approving vendor payment:', error);
    }
  };

  const handleRejectVendorPayment = async (id: string) => {
    try {
      await api.post(`/api/payments/vendor-payments/${id}/reject`);
      setVendorPayments(vendorPayments.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error rejecting vendor payment:', error);
    }
  };

  return (
    <div>
      <h2>Payment Approvals</h2>
      <h3>Pending Transactions</h3>
      <ul>
        {transactions.map((transaction) => (
          <li key={transaction.id}>
            {transaction.description} - ${transaction.amount}
            <button onClick={() => handleApproveTransaction(transaction.id)}>Approve</button>
            <button onClick={() => handleRejectTransaction(transaction.id)}>Reject</button>
          </li>
        ))}
      </ul>
      <h3>Pending Vendor Payments</h3>
      <ul>
        {vendorPayments.map((payment) => (
          <li key={payment.id}>
            {payment.notes} - ${payment.amount}
            <button onClick={() => handleApproveVendorPayment(payment.id)}>Approve</button>
            <button onClick={() => handleRejectVendorPayment(payment.id)}>Reject</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PaymentApproval;