import React, { useState } from 'react';

interface VendorPaymentModalProps {
  workOrderId: string;
  vendorName: string;
  amount: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

const VendorPaymentModal: React.FC<VendorPaymentModalProps> = ({
  workOrderId,
  vendorName,
  amount,
  onClose,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/vendor-payments/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workOrderId }),
      });

      if (!response.ok) {
        throw new Error('Payment failed');
      }

      onPaymentSuccess();
    } catch (err) {
      setError('Failed to process payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Pay Vendor</h2>
        <p>
          You are about to pay <strong>{vendorName}</strong> the amount of{' '}
          <strong>${amount.toFixed(2)}</strong> for work order{' '}
          <strong>{workOrderId}</strong>.
        </p>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions">
          <button onClick={onClose} disabled={isProcessing}>
            Cancel
          </button>
          <button onClick={handlePayment} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorPaymentModal;