import React, { useState } from 'react';
import { TextField, Button, List, ListItem, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import marketplaceService from '../services/marketplaceService';

const MarketplaceSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ location: '', priceRange: [0, 0], amenities: [] });
  const [matches, setMatches] = useState([]);

  const { data, refetch } = useQuery({
    queryKey: ['matches', searchTerm, filters],
    queryFn: async () => {
      if (!searchTerm) return [];
      // Call API for search
      const response = await fetch('/api/marketplace/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm, filters }),
      });
      return response.json();
    },
    enabled: false,
  });

  const handleSearch = () => {
    refetch();
  };

  React.useEffect(() => {
    if (data) setMatches(data.matches);
  }, [data]);

  return (
    <div>
      <Typography variant="h6">Tenant Search & Matching</Typography>
      <TextField
        label="Search properties"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button onClick={handleSearch} variant="contained">
        Search
      </Button>
      <List>
        {matches.map((match) => (
          <ListItem key={match.id}>
            {match.property.address} - Score: {match.matchScore}
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default MarketplaceSearch;