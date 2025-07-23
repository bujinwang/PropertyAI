/**
 * AI Personalization Dashboard Page
 * Main page for the AI Personalization Dashboard feature
 */

import React from 'react';
import AIPersonalizationDashboard from '../components/personalization/AIPersonalizationDashboard';

const AIPersonalizationDashboardPage: React.FC = () => {
  const handlePreferencesUpdate = (preferences: any) => {
    console.log('Preferences updated:', preferences);
    // In a real app, this would update user preferences via API
  };

  const handleRefresh = () => {
    console.log('Dashboard refreshed');
    // In a real app, this would trigger a refresh of recommendations
  };

  return (
    <AIPersonalizationDashboard
      userId="current-user-id" // In a real app, get from auth context
      onPreferencesUpdate={handlePreferencesUpdate}
      onRefresh={handleRefresh}
    />
  );
};

export default AIPersonalizationDashboardPage;
