import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Stack,
  Tooltip,
  Alert,
  CircularProgress,
  Fab
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { EmergencyContact } from '../../types/emergency-response';
import { emergencyResponseService } from '../../services/emergencyResponseService';
import { ContactManagementModal } from './ContactManagementModal';

interface EmergencyContactManagementProps {
  onContactSelect?: (contact: EmergencyContact) => void;
  maxHeight?: number;
  showAddButton?: boolean;
  readOnly?: boolean;
}

const EmergencyContactManagement: React.FC<EmergencyContactManagementProps> = ({
  onContactSelect,
  maxHeight = 600,
  showAddButton = true,
  readOnly = false
}) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  // Load contacts on component mount
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const contactsData = await emergencyResponseService.getEmergencyContacts();
      setContacts(contactsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  // Filter contacts based on search term
  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts;
    
    const term = searchTerm.toLowerCase();
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(term) ||
      contact.role.toLowerCase().includes(term) ||
      contact.department?.toLowerCase().includes(term) ||
      contact.specialties.some(specialty => specialty.toLowerCase().includes(term)) ||
      contact.phone.includes(term)
    );
  }, [contacts, searchTerm]);

  // Sort contacts by priority and availability
  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) => {
      // On-call contacts first
      if (a.availability.onCall && !b.availability.onCall) return -1;
      if (!a.availability.onCall && b.availability.onCall) return 1;
      
      // Then by priority (lower number = higher priority)
      return a.priority - b.priority;
    });
  }, [filteredContacts]);

  const handleCall = (contact: EmergencyContact) => {
    // Use tel: protocol to initiate phone call
    window.location.href = `tel:${contact.phone}`;
    
    // Track the interaction
    if (onContactSelect) {
      onContactSelect(contact);
    }
  };

  const handleMessage = (contact: EmergencyContact) => {
    // Use sms: protocol to initiate text message
    window.location.href = `sms:${contact.phone}`;
    
    // Track the interaction
    if (onContactSelect) {
      onContactSelect(contact);
    }
  };

  const handleEdit = (contact: EmergencyContact) => {
    setSelectedContact(contact);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleDelete = async (contact: EmergencyContact) => {
    if (window.confirm(`Are you sure you want to delete ${contact.name}?`)) {
      try {
        await emergencyResponseService.deleteEmergencyContact(contact.id);
        await loadContacts(); // Reload the list
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete contact');
      }
    }
  };

  const handleAdd = () => {
    setSelectedContact(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedContact(null);
  };

  const handleModalSave = async () => {
    setModalOpen(false);
    setSelectedContact(null);
    await loadContacts(); // Reload the list
  };

  const getAvailabilityStatus = (contact: EmergencyContact) => {
    if (contact.availability.onCall) {
      return { label: 'On Call', color: 'success' as const };
    }
    
    // Simple availability check based on hours
    const now = new Date();
    const currentHour = now.getHours();
    
    // Parse availability hours (assuming format like "9:00-17:00")
    const hoursMatch = contact.availability.hours.match(/(\d+):(\d+)-(\d+):(\d+)/);
    if (hoursMatch) {
      const startHour = parseInt(hoursMatch[1]);
      const endHour = parseInt(hoursMatch[3]);
      
      if (currentHour >= startHour && currentHour < endHour) {
        return { label: 'Available', color: 'success' as const };
      }
    }
    
    return { label: 'Off Hours', color: 'default' as const };
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box position="relative">
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h2">
              Emergency Contacts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sortedContacts.length} contact{sortedContacts.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Search Field */}
          <TextField
            fullWidth
            placeholder="Search contacts by name, role, department, or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* Contacts List */}
          <Box
            sx={{
              maxHeight,
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1
            }}
          >
            {sortedContacts.length === 0 ? (
              <Box p={3} textAlign="center">
                <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  {searchTerm ? 'No contacts found matching your search' : 'No emergency contacts configured'}
                </Typography>
                {!readOnly && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                    sx={{ mt: 2 }}
                  >
                    Add First Contact
                  </Button>
                )}
              </Box>
            ) : (
              <List disablePadding>
                {sortedContacts.map((contact, index) => {
                  const availabilityStatus = getAvailabilityStatus(contact);
                  
                  return (
                    <ListItem
                      key={contact.id}
                      divider={index < sortedContacts.length - 1}
                      sx={{
                        py: 2,
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Typography variant="subtitle1" component="span">
                              {contact.name}
                            </Typography>
                            <Chip
                              label={availabilityStatus.label}
                              color={availabilityStatus.color}
                              size="small"
                            />
                            {contact.priority <= 3 && (
                              <Chip
                                label="High Priority"
                                color="warning"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Stack spacing={0.5}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <BusinessIcon fontSize="small" />
                              <Typography variant="body2">
                                {contact.role}
                                {contact.department && ` • ${contact.department}`}
                              </Typography>
                            </Box>
                            
                            <Box display="flex" alignItems="center" gap={1}>
                              <PhoneIcon fontSize="small" />
                              <Typography variant="body2">
                                {contact.phone}
                                {contact.alternatePhone && ` • Alt: ${contact.alternatePhone}`}
                              </Typography>
                            </Box>
                            
                            <Box display="flex" alignItems="center" gap={1}>
                              <ScheduleIcon fontSize="small" />
                              <Typography variant="body2">
                                {contact.availability.hours} ({contact.availability.timezone})
                              </Typography>
                            </Box>
                            
                            {contact.specialties.length > 0 && (
                              <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                                {contact.specialties.map((specialty) => (
                                  <Chip
                                    key={specialty}
                                    label={specialty}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.75rem', height: 20 }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Stack>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          {/* One-tap call button */}
                          <Tooltip title="Call">
                            <IconButton
                              color="primary"
                              onClick={() => handleCall(contact)}
                              size="small"
                            >
                              <PhoneIcon />
                            </IconButton>
                          </Tooltip>
                          
                          {/* One-tap message button */}
                          <Tooltip title="Send Message">
                            <IconButton
                              color="primary"
                              onClick={() => handleMessage(contact)}
                              size="small"
                            >
                              <MessageIcon />
                            </IconButton>
                          </Tooltip>
                          
                          {!readOnly && (
                            <>
                              {/* Edit button */}
                              <Tooltip title="Edit Contact">
                                <IconButton
                                  onClick={() => handleEdit(contact)}
                                  size="small"
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              
                              {/* Delete button */}
                              <Tooltip title="Delete Contact">
                                <IconButton
                                  color="error"
                                  onClick={() => handleDelete(contact)}
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Floating Add Button */}
      {showAddButton && !readOnly && (
        <Fab
          color="primary"
          aria-label="add contact"
          onClick={handleAdd}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Contact Management Modal */}
      <ContactManagementModal
        open={modalOpen}
        mode={modalMode}
        contact={selectedContact}
        onClose={handleModalClose}
        onSave={handleModalSave}
      />
    </Box>
  );
};

export default EmergencyContactManagement;