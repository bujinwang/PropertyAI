import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import axios from 'axios';

const MaintenanceDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await axios.get<any[]>('http://localhost:5000/api/maintenance');
        setTickets(response.data);
      } catch (error) {
        console.error('Error fetching maintenance tickets:', error);
      }
    };

    fetchTickets();
  }, []);

  const handlePredictFailure = async (applianceId: string) => {
    try {
      const response = await axios.get<{ prediction: string }>(`http://localhost:5000/api/predictive-maintenance/predict/${applianceId}`);
      alert(`Prediction for appliance ${applianceId}: ${response.data.prediction}`);
    } catch (error) {
      console.error('Error predicting failure:', error);
    }
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Property</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>{ticket.title}</TableCell>
              <TableCell>{ticket.status}</TableCell>
              <TableCell>{ticket.priority}</TableCell>
              <TableCell>{ticket.property.name}</TableCell>
              <TableCell>{ticket.unit.unitNumber}</TableCell>
              <TableCell>
                {ticket.unit.appliances?.map((appliance: any) => (
                  <Button
                    key={appliance.id}
                    variant="contained"
                    color="secondary"
                    onClick={() => handlePredictFailure(appliance.id)}
                  >
                    Predict Failure for {appliance.type}
                  </Button>
                ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MaintenanceDashboard;
