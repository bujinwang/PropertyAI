import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Pagination,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Link } from 'react-router-dom';
import PropertyForm from '../components/PropertyForm';
import { Link } from 'react-router-dom';
import { dashboardService, Property } from '../services/dashboardService';

const columns = [
  { field: 'id', headerName: 'ID', width: 90, hide: true },
  {
    field: 'address',
    headerName: 'Address',
    width: 250,
    renderCell: (params: any) => (
      <Link to={`/properties/${params.row.id}`} style={{ textDecoration: 'none' }}>
        {params.value}
      </Link>
    ),
  },
  { field: 'propertyType', headerName: 'Type', width: 120 },
  { field: 'status', headerName: 'Status', width: 100 },
  { field: 'totalUnits', headerName: 'Units', width: 80 },
  {
    field: 'createdAt',
    headerName: 'Created',
    width: 150,
    valueFormatter: (params: any) => new Date(params.value).toLocaleDateString(),
  },
];

const PropertyList: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  const [openForm, setOpenForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Partial<any>>({});
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getProperties(page, limit, searchTerm);
      setProperties(response.data);
      setTotal(response.total);
    } catch (err) {
      setError('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [page, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleOpenForm = (isEdit: boolean = false, property: Partial<any> = {}) => {
    setEditMode(isEdit);
    setSelectedProperty(property);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedProperty({});
  };

  const handleSubmitSuccess = () => {
    fetchProperties();
    handleCloseForm();
  };

  const handleOpenDelete = (id: string) => {
    setSelectedDeleteId(id);
    setOpenDelete(true);
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setSelectedDeleteId(null);
  };

  const handleDelete = async () => {
    if (selectedDeleteId) {
      try {
        await dashboardService.deleteProperty(selectedDeleteId);
        fetchProperties();
      } catch (error) {
        setError('Failed to delete property');
      }
      handleCloseDelete();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Property Listings
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'end', flexWrap: 'wrap' }}>
          <TextField
            label="Search Properties"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by address or type..."
            sx={{ minWidth: 300 }}
          />
          <Button variant="contained" component={Link} to="/properties/new">
            Add Property
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ minHeight: 400 }}>
        <Table aria-label="Property listings table">
          <TableHead>
            <TableRow>
              <TableCell>Address</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Units</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {properties.map((property) => (
              <TableRow key={property.id}>
                <TableCell>
                  <Link to={`/properties/${property.id}`} style={{ textDecoration: 'none' }}>
                    {property.address}
                  </Link>
                </TableCell>
                <TableCell>{property.propertyType}</TableCell>
                <TableCell>{property.status}</TableCell>
                <TableCell>{property.totalUnits}</TableCell>
                <TableCell>{new Date(property.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
          aria-label="Property list pagination"
        />
      </Box>
    </Box>
  );
};

export default PropertyList;