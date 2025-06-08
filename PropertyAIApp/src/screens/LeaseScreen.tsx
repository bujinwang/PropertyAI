import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

interface Lease {
  id: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
}

const LeaseScreen: React.FC = () => {
  const [lease, setLease] = useState<Lease | null>(null);

  useEffect(() => {
    const fetchLease = async () => {
      try {
        const response = await fetch('/api/leases/123'); // This is a placeholder
        const data = await response.json();
        setLease(data);
      } catch (error) {
        console.error('Error fetching lease:', error);
      }
    };

    fetchLease();
  }, []);

  return (
    <View>
      <Text>Lease Information</Text>
      {lease && (
        <View>
          <Text>Start Date: {lease.startDate}</Text>
          <Text>End Date: {lease.endDate}</Text>
          <Text>Rent Amount: ${lease.rentAmount}</Text>
        </View>
      )}
    </View>
  );
};

export default LeaseScreen;
