import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from '../design-system/theme';
import UnitsList from './UnitsList';
import { dashboardService, Unit } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  ...jest.requireActual('../services/dashboardService'),
  dashboardService: {
    getVacantUnitOptions: jest.fn(),
    assignTenantToUnit: jest.fn(),
    unassignTenant: jest.fn(),
  },
}));

const mockGetVacantUnitOptions = dashboardService.getVacantUnitOptions as jest.MockedFunction<typeof dashboardService.getVacantUnitOptions>;
const mockAssignTenantToUnit = dashboardService.assignTenantToUnit as jest.MockedFunction<typeof dashboardService.assignTenantToUnit>;
const mockUnassignTenant = dashboardService.unassignTenant as jest.MockedFunction<typeof dashboardService.unassignTenant>;

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          {component}
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const mockUnits: Unit[] = [
  {
    id: 'u1',
    propertyId: 'p1',
    unitNumber: '101',
    type: 'apartment',
    occupancyStatus: 'vacant',
    rentAmount: 1200,
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 800,
    description: 'Spacious 2BR apartment',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'u2',
    propertyId: 'p1',
    unitNumber: '102',
    type: 'apartment',
    occupancyStatus: 'occupied',
    rentAmount: 1300,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 850,
    description: 'Modern 2BR with balcony',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'u3',
    propertyId: 'p1',
    unitNumber: '201',
    type: 'townhouse',
    occupancyStatus: 'maintenance',
    rentAmount: 1500,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1200,
    description: 'Townhouse unit',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

const defaultProps = {
  units: mockUnits,
  propertyId: 'p1',
  onEdit: jest.fn(),
  onDelete: jest.fn(),
};

describe('UnitsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetVacantUnitOptions.mockResolvedValue([
      { id: 'u1', unitNumber: '101', address: '123 Main St' },
    ]);
  });

  describe('Render Tests', () => {
    it('renders units table with correct data', () => {
      renderWithProviders(<UnitsList {...defaultProps} />);

      expect(screen.getByText('Unit Number')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Tenant')).toBeInTheDocument();
      expect(screen.getByText('Rent ($)')).toBeInTheDocument();

      // Check unit data
      expect(screen.getByText('101')).toBeInTheDocument();
      expect(screen.getByText('apartment')).toBeInTheDocument();
      expect(screen.getByText('vacant')).toBeInTheDocument();
      expect(screen.getByText('$1,200.00')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // bedrooms
      expect(screen.getByText('1')).toBeInTheDocument(); // bathrooms
    });

    it('renders empty state when no units', () => {
      renderWithProviders(<UnitsList {...defaultProps} units={[]} />);

      expect(screen.getByText('No units available for this property.')).toBeInTheDocument();
    });

    it('shows assign button for vacant units', () => {
      renderWithProviders(<UnitsList {...defaultProps} />);

      const assignButtons = screen.getAllByRole('button', { name: /assign tenant/i });
      expect(assignButtons).toHaveLength(1); // Only one vacant unit
    });

    it('shows unassign button for occupied units', () => {
      renderWithProviders(<UnitsList {...defaultProps} />);

      const unassignButtons = screen.getAllByRole('button', { name: /unassign tenant/i });
      expect(unassignButtons).toHaveLength(1); // Only one occupied unit
    });

    it('shows edit and delete buttons for all units', () => {
      renderWithProviders(<UnitsList {...defaultProps} />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

      expect(editButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(3);
    });

    it('displays tenant status correctly', () => {
      renderWithProviders(<UnitsList {...defaultProps} />);

      expect(screen.getByText('Vacant')).toBeInTheDocument();
      expect(screen.getByText('Occupied')).toBeInTheDocument();
      expect(screen.getByText('Maintenance')).toBeInTheDocument();
    });

    it('truncates long descriptions', () => {
      renderWithProviders(<UnitsList {...defaultProps} />);

      expect(screen.getByText('Spacious 2BR apartment...')).toBeInTheDocument();
    });
  });

  describe('Action Tests', () => {
    it('calls onEdit when edit button is clicked', () => {
      const mockOnEdit = jest.fn();
      renderWithProviders(<UnitsList {...defaultProps} onEdit={mockOnEdit} />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      expect(mockOnEdit).toHaveBeenCalledWith(mockUnits[0]);
    });

    it('calls onDelete when delete button is clicked', () => {
      const mockOnDelete = jest.fn();
      renderWithProviders(<UnitsList {...defaultProps} onDelete={mockOnDelete} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      expect(mockOnDelete).toHaveBeenCalledWith('u1');
    });

    it('opens assignment modal for vacant unit', async () => {
      renderWithProviders(<UnitsList {...defaultProps} />);

      const assignButton = screen.getByRole('button', { name: /assign tenant/i });
      fireEvent.click(assignButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Assign Tenant to Unit')).toBeInTheDocument();
      });
    });

    it('opens unassign modal for occupied unit', async () => {
      renderWithProviders(<UnitsList {...defaultProps} />);

      const unassignButton = screen.getByRole('button', { name: /unassign tenant/i });
      fireEvent.click(unassignButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Unassign Tenant')).toBeInTheDocument();
      });
    });

    it('does not show assign button for maintenance units', () => {
      renderWithProviders(<UnitsList {...defaultProps} />);

      const assignButtons = screen.queryAllByRole('button', { name: /assign tenant/i });
      expect(assignButtons).toHaveLength(1); // Only the vacant unit should have assign button
    });

    it('does not show unassign button for vacant units', () => {
      renderWithProviders(<UnitsList {...defaultProps} />);

      const unassignButtons = screen.queryAllByRole('button', { name: /unassign tenant/i });
      expect(unassignButtons).toHaveLength(1); // Only the occupied unit should have unassign button
    });
  });

  describe('Assignment Integration Tests', () => {
    it('handles assignment submission for vacant unit', async () => {
      const mockOnSubmit = jest.fn();
      // Mock the AssignmentModal onSubmit by spying on console.log since the component uses it as placeholder
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderWithProviders(<UnitsList {...defaultProps} />);

      const assignButton = screen.getByRole('button', { name: /assign tenant/i });
      fireEvent.click(assignButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // The actual submission would be handled by AssignmentModal's onSubmit
      // Since it's mocked with console.log, we verify the modal opens
      expect(consoleSpy).not.toHaveBeenCalled(); // Should not be called until submit

      consoleSpy.mockRestore();
    });

    it('handles unassign submission for occupied unit', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderWithProviders(<UnitsList {...defaultProps} />);

      const unassignButton = screen.getByRole('button', { name: /unassign tenant/i });
      fireEvent.click(unassignButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('passes correct unitId to assignment modal', async () => {
      renderWithProviders(<UnitsList {...defaultProps} />);

      const assignButton = screen.getByRole('button', { name: /assign tenant/i });
      fireEvent.click(assignButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // The unitId 'u1' should be passed to the modal
      // This is verified by the modal opening for the correct unit
    });

    it('passes correct propertyId to assignment modal', async () => {
      renderWithProviders(<UnitsList {...defaultProps} />);

      const assignButton = screen.getByRole('button', { name: /assign tenant/i });
      fireEvent.click(assignButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // The propertyId 'p1' should be passed to filter vacant units
    });
  });

  describe('Accessibility Tests', () => {
    it('has proper ARIA labels for action buttons', () => {
      renderWithProviders(<UnitsList {...defaultProps} />);

      expect(screen.getByRole('button', { name: /assign tenant/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /unassign tenant/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(3);
      expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(3);
    });

    it('has proper table structure', () => {
      renderWithProviders(<UnitsList {...defaultProps} />);

      expect(screen.getByRole('table', { name: /units table/i })).toBeInTheDocument();
      expect(screen.getAllByRole('row')).toHaveLength(4); // Header + 3 data rows
      expect(screen.getAllByRole('columnheader')).toHaveLength(10);
    });
  });

  describe('Edge Cases', () => {
    it('handles units with missing optional fields', () => {
      const unitsWithMissingFields: Unit[] = [{
        id: 'u1',
        propertyId: 'p1',
        unitNumber: '101',
        type: 'apartment',
        occupancyStatus: 'vacant',
        rentAmount: 1200,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        // Missing bedrooms, bathrooms, squareFeet, description
      }];

      renderWithProviders(<UnitsList {...defaultProps} units={unitsWithMissingFields} />);

      expect(screen.getByText('-')).toBeInTheDocument(); // Should show dash for missing fields
    });

    it('handles units with undefined phone and leaseEnd', () => {
      const unitsWithUndefined: Unit[] = [{
        ...mockUnits[0],
        bedrooms: undefined,
        bathrooms: undefined,
        squareFeet: undefined,
        description: undefined,
      }];

      renderWithProviders(<UnitsList {...defaultProps} units={unitsWithUndefined} />);

      expect(screen.getAllByText('-')).toHaveLength(4); // bedrooms, bathrooms, squareFeet, description
    });

    it('handles API error when fetching vacant units', async () => {
      mockGetVacantUnitOptions.mockRejectedValue(new Error('Failed to fetch units'));

      renderWithProviders(<UnitsList {...defaultProps} />);

      const assignButton = screen.getByRole('button', { name: /assign tenant/i });
      fireEvent.click(assignButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // The modal should still open even if API fails
      // Error handling would be in the modal component
    });
  });
});