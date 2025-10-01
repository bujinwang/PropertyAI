import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Unit } from '../services/dashboardService';

import AssignmentModal from './AssignmentModal';

interface UnitsListProps {
  units: Unit[];
  propertyId: string;
  onEdit: (unit: Unit) => void;
  onDelete: (unitId: string) => void;
  onAssignmentChange?: () => void; // Callback for parent to refetch data
}

const UnitsList: React.FC<UnitsListProps> = ({ units, propertyId, onEdit, onDelete, onAssignmentChange }) => {
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [assignMode, setAssignMode] = useState<'assign' | 'unassign'>('assign');
  const [currentUnitId, setCurrentUnitId] = useState<string | undefined>();

  if (units.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No units available for this property.
        </Typography>
      </Box>
    );
  }

  const handleAssignSubmit = (data: any) => {
    console.log('Assignment data:', data); // Placeholder until service implemented
    setOpenAssignModal(false);
    setCurrentUnitId(undefined);
    
    // Trigger parent callback to refetch data / invalidate queries
    if (onAssignmentChange) {
      onAssignmentChange();
    }
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table aria-label="units table">
          <TableHead>
            <TableRow>
              <TableCell>Unit Number</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Tenant</TableCell>
              <TableCell>Rent ($)</TableCell>
              <TableCell>Bedrooms</TableCell>
              <TableCell>Bathrooms</TableCell>
              <TableCell>Sq Ft</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {units.map((unit) => (
              <TableRow key={unit.id} hover>
                <TableCell>{unit.unitNumber}</TableCell>
                <TableCell>{unit.type}</TableCell>
                <TableCell>{unit.occupancyStatus}</TableCell>
                <TableCell>{unit.occupancyStatus === 'occupied' ? 'Occupied' : 'Vacant'}</TableCell>
                <TableCell>${unit.rentAmount.toFixed(2)}</TableCell>
                <TableCell>{unit.bedrooms || '-'}</TableCell>
                <TableCell>{unit.bathrooms || '-'}</TableCell>
                <TableCell>{unit.squareFeet || '-'}</TableCell>
                <TableCell>{unit.description ? unit.description.substring(0, 50) + '...' : '-'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => onEdit(unit)} color="primary" size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => onDelete(unit.id)} color="error" size="small">
                    <DeleteIcon />
                  </IconButton>
                  {unit.occupancyStatus === 'vacant' && (
                    <IconButton
                      onClick={() => {
                        setCurrentUnitId(unit.id);
                        setAssignMode('assign');
                        setOpenAssignModal(true);
                      }}
                      color="primary"
                      size="small"
                      aria-label="Assign tenant"
                    >
                      <AssignmentIcon />
                    </IconButton>
                  )}
                  {unit.occupancyStatus === 'occupied' && (
                    <IconButton
                      onClick={() => {
                        setCurrentUnitId(unit.id);
                        setAssignMode('unassign');
                        setOpenAssignModal(true);
                      }}
                      color="secondary"
                      size="small"
                      aria-label="Unassign tenant"
                    >
                      <AssignmentIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <AssignmentModal
        open={openAssignModal}
        onClose={() => setOpenAssignModal(false)}
        unitId={currentUnitId}
        mode={assignMode}
        propertyId={propertyId}
        tenantId={undefined}
        onSubmit={handleAssignSubmit}
      />
    </>
  );
};

export default UnitsList;