import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import ApiService from '../services/apiService';

const MaintenanceDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const apiService = new ApiService('http://localhost:5000/api');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await apiService.get('maintenance-requests');
        setTickets(response);
      } catch (error) {
        console.error('Error fetching maintenance tickets:', error);
      }
    };

    fetchTickets();
  }, []);

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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MaintenanceDashboard;
