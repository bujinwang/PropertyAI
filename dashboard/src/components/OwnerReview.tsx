import React, { useState, useEffect } from 'react';
import { List, ListItem, Button, Typography, Box } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const OwnerReview = () => {
  const queryClient = useQueryClient();

  const { data: pendingApplications, refetch: refetchApplications } = useQuery({
    queryKey: ['pendingApplications'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace/applications/pending', {
        headers: { 'Authorization': 'Bearer mock-token' },
      });
      return response.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (applicationId) => {
      const response = await fetch(`/api/marketplace/application/${applicationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Approval failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingApplications']);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (applicationId) => {
      const response = await fetch(`/api/marketplace/application/${applicationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Rejection failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingApplications']);
    },
  });

  const handleApprove = (applicationId) => {
    approveMutation.mutate(applicationId);
  };

  const handleReject = (applicationId) => {
    rejectMutation.mutate(applicationId);
  };

  return (
    <Box>
      <Typography variant="h6">Owner Review Queue</Typography>
      <List>
        {pendingApplications?.applications.map((app) => (
          <ListItem key={app.id}>
            <Typography>{app.tenant.name} for {app.property.address}</Typography>
            <Button onClick={() => handleApprove(app.id)} variant="contained" size="small">
              Approve
            </Button>
            <Button onClick={() => handleReject(app.id)} variant="outlined" size="small">
              Reject
            </Button>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default OwnerReview;