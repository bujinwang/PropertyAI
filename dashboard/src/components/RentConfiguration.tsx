import React, { useState } from 'react';

interface RentConfigurationProps {
  leaseId: string;
}

const RentConfiguration: React.FC<RentConfigurationProps> = ({ leaseId }) => {
  const [rentAmount, setRentAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [lateFee, setLateFee] = useState(0);
  const [status, setStatus] = useState('');

  const saveConfiguration = async () => {
    try {
      setStatus('Saving configuration...');
      const response = await fetch(`/api/leases/${leaseId}/rent-configuration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentAmount,
          dueDate,
          lateFee,
        }),
      });
      const json = await response.json();
      setStatus(`Configuration saved: ${JSON.stringify(json)}`);
    } catch (error) {
      if (error instanceof Error) {
        setStatus(`Error saving configuration: ${error.message}`);
      } else {
        setStatus('An unknown error occurred');
      }
    }
  };

  return (
    <div>
      <h1>Rent Configuration</h1>
      <input
        type="number"
        placeholder="Rent Amount"
        onChange={(e) => setRentAmount(parseInt(e.target.value, 10))}
      />
      <input
        type="date"
        placeholder="Due Date"
        onChange={(e) => setDueDate(e.target.value)}
      />
      <input
        type="number"
        placeholder="Late Fee"
        onChange={(e) => setLateFee(parseInt(e.target.value, 10))}
      />
      <button onClick={saveConfiguration}>Save Configuration</button>
      {status && <p>{status}</p>}
    </div>
  );
};

export default RentConfiguration;
