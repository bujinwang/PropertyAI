import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  isLoading: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  // For now, assume we're connected. This can be enhanced with NetInfo later
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // TODO: Implement NetInfo for actual network detection
    setIsLoading(false);
  }, []);

  const value: NetworkContextType = {
    isConnected,
    isInternetReachable: isConnected,
    type: 'wifi', // Default assumption
    isLoading,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}