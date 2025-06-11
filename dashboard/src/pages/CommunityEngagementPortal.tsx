import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';

const CommunityEngagementPortal: React.FC = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="community engagement portal tabs">
          <Tab label="Announcements" />
          <Tab label="Events" />
          <Tab label="Forum" />
          <Tab label="Services" />
          <Tab label="Amenities" />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        Announcements
      </TabPanel>
      <TabPanel value={value} index={1}>
        Events
      </TabPanel>
      <TabPanel value={value} index={2}>
        Forum
      </TabPanel>
      <TabPanel value={value} index={3}>
        Service Recommendations
      </TabPanel>
      <TabPanel value={value} index={4}>
        Amenity Reservations
      </TabPanel>
    </Box>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default CommunityEngagementPortal;
