import React, { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import PaymentHistory from '../components/PaymentHistory';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
// Assume existing imports for other tabs: PropertiesTab, TenantsTab, etc.

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`,
  };
}

const Dashboard = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="dashboard tabs">
          {/* Existing tabs */}
          <Tab label="Properties" {...a11yProps(0)} />
          <Tab label="Tenants" {...a11yProps(1)} />
          {/* ... other existing tabs */}
          
          {/* New Payments tab */}
          <Tab label="Payments" {...a11yProps(3)} />
          <Tab label="Analytics" {...a11yProps(4)} />
        </Tabs>
      </Box>
      
      <TabPanel value={value} index={0}>
        {/* Existing Properties content */}
        Properties Tab Content
      </TabPanel>
      
      <TabPanel value={value} index={1}>
        {/* Existing Tenants content */}
        Tenants Tab Content
      </TabPanel>
      
      {/* ... other existing panels */}
      
      {/* New Payments panel */}
      <TabPanel value={value} index={3}>
        <PaymentHistory />
      </TabPanel>

      <TabPanel value={value} index={4}>
        <AnalyticsDashboard />
      </TabPanel>
    </Box>
  );
};

export default Dashboard;
