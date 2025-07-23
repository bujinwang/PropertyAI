import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import EmergencyContactManagement from './EmergencyContactManagement';
import { emergencyResponseService } from '../../services/emergencyResponseService';
import { EmergencyContact } from '../../types/emergency-response';

// Mock the emergency response service
jest.mock('../../services/emergencyResponseService');
const mockEmergencyResponseService = emergencyResponseService as jest.Mocked<typeof emergencyResponseService>;

// Mock window.location.href
const mockLocationHref = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    href: mockLocationHref
  },
  writable: true
});

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
});

const theme = createTheme();

const mockContacts: EmergencyContact[] = [
  {
    id: '1',
    name: 'John Smith',
    role: 'Property Manager',
    department: 'Management',
    phone: '+1-555-0101',
    email: 'john.smith@example.com',
    alternatePhone: '+1-555-0102',
    availability: {
      hours: '9:00-17:00',
      timezone: 'America/New_York',
      onCall: true
    },
    specialties: ['Property Management', 'Emergency Coordination'],
    priority: 1
  },
  {
    id: '2',
    name: 'Jane Doe',
    role: 'Maintenance Supervisor',
    department: 'Maintenance',
    phone: '+1-555-0201',
    email: 'jane.doe@example.com',
    availability: {
      hours: '8:00-16:00',
      timezone: 'America/New_York',
      onCall: false
    },
    specialties: ['HVAC', 'Electrical', 'Plumbing'],
    priority: 2
  },
  {
    id: '3',
    name: 'Bob Wilson',
    role: 'Security Guard',
    phone: '+1-555-0301',
    availability: {
      hours: '0:00-24:00',
      timezone: 'America/New_York',
      onCall: false
    },
    specialties: ['Security'],
    priority: 3
  }
];

const renderComponent = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <EmergencyContactManagement {...props} />
    </ThemeProvider>
  );
};

describe('EmergencyContactManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEmergencyResponseService.getEmergencyContacts.mockResolvedValue(mockContacts);
  });

  describe('Component Rendering', () => {
    it('renders the component with title and search field', async () => {
      renderComponent();

      expect(screen.getByText('Emergency Contacts')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search contacts/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('3 contacts')).toBeInTheDocument();
      });
    });

    it('displays loading state initially', () => {
      renderComponent();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays contacts after loading', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      });
    });

    it('displays contact details correctly', async () => {
      renderComponent();

      await waitFor(() => {
        // Check John Smith's details
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Property Manager • Management')).toBeInTheDocument();
        expect(screen.getByText('+1-555-0101 • Alt: +1-555-0102')).toBeInTheDocument();
        expect(screen.getByText('On Call')).toBeInTheDocument();
        expect(screen.getByText('High Priority')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('filters contacts by name', async () => {
      const user = userEvent;
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, 'John');

      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });

    it('filters contacts by role', async () => {
      const user = userEvent;
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, 'Maintenance');

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });

    it('filters contacts by specialty', async () => {
      const user = userEvent;
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, 'HVAC');

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });

    it('shows no results message when search yields no matches', async () => {
      const user = userEvent;
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, 'NonexistentContact');

      expect(screen.getByText('No contacts found matching your search')).toBeInTheDocument();
    });
  });

  describe('Contact Actions', () => {
    it('initiates phone call when call button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const callButtons = screen.getAllByLabelText('Call');
      fireEvent.click(callButtons[0]);

      expect(mockLocationHref).toHaveBeenCalledWith('tel:+1-555-0101');
    });

    it('initiates text message when message button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const messageButtons = screen.getAllByLabelText('Send Message');
      fireEvent.click(messageButtons[0]);

      expect(mockLocationHref).toHaveBeenCalledWith('sms:+1-555-0101');
    });

    it('calls onContactSelect when contact is interacted with', async () => {
      const mockOnContactSelect = jest.fn();
      renderComponent({ onContactSelect: mockOnContactSelect });

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const callButtons = screen.getAllByLabelText('Call');
      fireEvent.click(callButtons[0]);

      expect(mockOnContactSelect).toHaveBeenCalledWith(mockContacts[0]);
    });

    it('opens edit modal when edit button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByLabelText('Edit Contact');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Edit Emergency Contact')).toBeInTheDocument();
    });

    it('deletes contact when delete button is clicked and confirmed', async () => {
      mockConfirm.mockReturnValue(true);
      mockEmergencyResponseService.deleteEmergencyContact.mockResolvedValue();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Delete Contact');
      fireEvent.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete John Smith?');
      expect(mockEmergencyResponseService.deleteEmergencyContact).toHaveBeenCalledWith('1');
    });

    it('does not delete contact when deletion is not confirmed', async () => {
      mockConfirm.mockReturnValue(false);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Delete Contact');
      fireEvent.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockEmergencyResponseService.deleteEmergencyContact).not.toHaveBeenCalled();
    });
  });

  describe('Add Contact', () => {
    it('opens add modal when floating add button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const addButton = screen.getByLabelText('add contact');
      fireEvent.click(addButton);

      expect(screen.getByText('Add Emergency Contact')).toBeInTheDocument();
    });

    it('shows add first contact button when no contacts exist', async () => {
      mockEmergencyResponseService.getEmergencyContacts.mockResolvedValue([]);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No emergency contacts configured')).toBeInTheDocument();
        expect(screen.getByText('Add First Contact')).toBeInTheDocument();
      });
    });

    it('hides add button when showAddButton is false', async () => {
      renderComponent({ showAddButton: false });

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('add contact')).not.toBeInTheDocument();
    });
  });

  describe('Read-only Mode', () => {
    it('hides edit and delete buttons in read-only mode', async () => {
      renderComponent({ readOnly: true });

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('Edit Contact')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Delete Contact')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('add contact')).not.toBeInTheDocument();
    });

    it('still shows call and message buttons in read-only mode', async () => {
      renderComponent({ readOnly: true });

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      expect(screen.getAllByLabelText('Call')).toHaveLength(3);
      expect(screen.getAllByLabelText('Send Message')).toHaveLength(3);
    });
  });

  describe('Contact Sorting', () => {
    it('sorts contacts with on-call contacts first', async () => {
      renderComponent();

      await waitFor(() => {
        const contactNames = screen.getAllByText(/John Smith|Jane Doe|Bob Wilson/);
        // John Smith should be first because he's on call
        expect(contactNames[0]).toHaveTextContent('John Smith');
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when loading contacts fails', async () => {
      mockEmergencyResponseService.getEmergencyContacts.mockRejectedValue(
        new Error('Failed to load contacts')
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Failed to load contacts')).toBeInTheDocument();
      });
    });

    it('displays error message when deleting contact fails', async () => {
      mockConfirm.mockReturnValue(true);
      mockEmergencyResponseService.deleteEmergencyContact.mockRejectedValue(
        new Error('Failed to delete contact')
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Delete Contact');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete contact')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for buttons', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      expect(screen.getAllByLabelText('Call')).toHaveLength(3);
      expect(screen.getAllByLabelText('Send Message')).toHaveLength(3);
      expect(screen.getAllByLabelText('Edit Contact')).toHaveLength(3);
      expect(screen.getAllByLabelText('Delete Contact')).toHaveLength(3);
      expect(screen.getByLabelText('add contact')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent;
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      
      // Tab to search input
      await user.tab();
      expect(searchInput).toHaveFocus();

      // Can type in search input
      await user.type(searchInput, 'John');
      expect(searchInput).toHaveValue('John');
    });
  });
});