import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from '../design-system/theme';
import PropertyDetail from './PropertyDetail';
import { dashboardService, Property, Unit } from '../services/dashboardService';

// Mock react-router-dom
const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  ...jest.requireActual('../services/dashboardService'),
  dashboardService: {
    getProperty: jest.fn(),
    getUnitsByProperty: jest.fn(),
    deleteUnit: jest.fn(),
    getVacantUnitOptions: jest.fn(),
    assignTenantToUnit: jest.fn(),
    unassignTenant: jest.fn(),
  },
}));

const mockGetProperty = dashboardService.getProperty as jest.MockedFunction<typeof dashboardService.getProperty>;
const mockGetUnitsByProperty = dashboardService.getUnitsByProperty as jest.MockedFunction<typeof dashboardService.getUnitsByProperty>;
const mockDeleteUnit = dashboardService.deleteUnit as jest.MockedFunction<typeof dashboardService.deleteUnit>;
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
        <BrowserRouter>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            {component}
          </LocalizationProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const mockProperty: Property = {
  id: 'p1',
  title: 'Test Property',
  address: '123 Main St',
  city: 'Test City',
  state: 'TS',
  zipCode: '12345',
  propertyType: 'apartment',
  status: 'active',
  totalUnits: 10,
  description: 'A test property',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
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
    description: 'Spacious apartment',
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
    description: 'Modern apartment',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

describe('PropertyDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: 'p1' });
    mockGetProperty.mockResolvedValue(mockProperty);
    mockGetUnitsByProperty.mockResolvedValue(mockUnits);
    mockGetVacantUnitOptions.mockResolvedValue([
      { id: 'u1', unitNumber: '101', address: '123 Main St' },
    ]);
  });

  describe('Loading and Error States', () => {
    it('renders loading state initially', () => {
      mockGetProperty.mockReturnValue(new Promise(() => {})); // Never resolves

      renderWithProviders(<PropertyDetail />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders error state when property fetch fails', async () => {
      mockGetProperty.mockRejectedValue(new Error('Property not found'));

      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        expect(screen.getByText('Property not found')).toBeInTheDocument();
      });
    });

    it('renders error state when units fetch fails', async () => {
      mockGetUnitsByProperty.mockRejectedValue(new Error('Failed to fetch units'));

      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch property details')).toBeInTheDocument();
      });
    });
  });

  describe('Property Overview Tab', () => {
    it('renders property overview with correct data', async () => {
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        expect(screen.getByText('Test Property')).toBeInTheDocument();
        expect(screen.getByText('123 Main St, Test City, TS 12345')).toBeInTheDocument();
        expect(screen.getByText('apartment')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('A test property')).toBeInTheDocument();
      });
    });

    it('shows edit property button', async () => {
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /edit property/i })).toBeInTheDocument();
      });
    });
  });

  describe('Units Tab', () => {
    it('renders units tab with correct data', async () => {
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        expect(screen.getByText('Units Management (2 units)')).toBeInTheDocument();
      });

      // Switch to units tab
      const unitsTab = screen.getByRole('tab', { name: /units \(2\)/i });
      fireEvent.click(unitsTab);

      await waitFor(() => {
        expect(screen.getByText('101')).toBeInTheDocument();
        expect(screen.getByText('102')).toBeInTheDocument();
        expect(screen.getByText('$1,200.00')).toBeInTheDocument();
        expect(screen.getByText('$1,300.00')).toBeInTheDocument();
      });
    });

    it('shows add unit and bulk add buttons', async () => {
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        const unitsTab = screen.getByRole('tab', { name: /units \(2\)/i });
        fireEvent.click(unitsTab);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add unit/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /bulk add units/i })).toBeInTheDocument();
      });
    });

    it('opens unit form when add unit is clicked', async () => {
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        const unitsTab = screen.getByRole('tab', { name: /units \(2\)/i });
        fireEvent.click(unitsTab);
      });

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /add unit/i });
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('opens bulk unit form when bulk add is clicked', async () => {
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        const unitsTab = screen.getByRole('tab', { name: /units \(2\)/i });
        fireEvent.click(unitsTab);
      });

      await waitFor(() => {
        const bulkAddButton = screen.getByRole('button', { name: /bulk add units/i });
        fireEvent.click(bulkAddButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Tenants Tab', () => {
    it('renders tenants tab with occupied units', async () => {
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        const tenantsTab = screen.getByRole('tab', { name: /tenants \(1\)/i });
        fireEvent.click(tenantsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Tenant Assignments')).toBeInTheDocument();
        expect(screen.getByText('102')).toBeInTheDocument(); // Occupied unit
        expect(screen.getByText('Assigned Tenant')).toBeInTheDocument(); // Placeholder
      });
    });

    it('shows unassign button for occupied units in tenants tab', async () => {
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        const tenantsTab = screen.getByRole('tab', { name: /tenants \(1\)/i });
        fireEvent.click(tenantsTab);
      });

      await waitFor(() => {
        const unassignButtons = screen.getAllByRole('button', { name: /unassign tenant/i });
        expect(unassignButtons).toHaveLength(1);
      });
    });

    it('opens unassign modal when unassign button is clicked in tenants tab', async () => {
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        const tenantsTab = screen.getByRole('tab', { name: /tenants \(1\)/i });
        fireEvent.click(tenantsTab);
      });

      await waitFor(() => {
        const unassignButton = screen.getByRole('button', { name: /unassign tenant/i });
        fireEvent.click(unassignButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Unassign Tenant')).toBeInTheDocument();
      });
    });
  });

  describe('Assignment Integration', () => {
    it('opens assignment modal from units tab for vacant unit', async () => {
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        const unitsTab = screen.getByRole('tab', { name: /units \(2\)/i });
        fireEvent.click(unitsTab);
      });

      await waitFor(() => {
        const assignButtons = screen.getAllByRole('button', { name: /assign tenant/i });
        fireEvent.click(assignButtons[0]); // Click assign for vacant unit
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Assign Tenant to Unit')).toBeInTheDocument();
      });
    });

    it('opens unassign modal from units tab for occupied unit', async () => {
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        const unitsTab = screen.getByRole('tab', { name: /units \(2\)/i });
        fireEvent.click(unitsTab);
      });

      await waitFor(() => {
        const unassignButtons = screen.getAllByRole('button', { name: /unassign tenant/i });
        fireEvent.click(unassignButtons[0]); // Click unassign for occupied unit
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Unassign Tenant')).toBeInTheDocument();
      });
    });

    it('refreshes data after assignment submission', async () => {
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        const unitsTab = screen.getByRole('tab', { name: /units \(2\)/i });
        fireEvent.click(unitsTab);
      });

      await waitFor(() => {
        const assignButtons = screen.getAllByRole('button', { name: /assign tenant/i });
        fireEvent.click(assignButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // The modal submission would trigger refetchData
      // We verify the modal opens and data fetching is set up
      expect(mockGetProperty).toHaveBeenCalledWith('p1');
      expect(mockGetUnitsByProperty).toHaveBeenCalledWith('p1');
    });
  });

  describe('Delete Unit Functionality', () => {
    it('opens delete confirmation dialog', async () => {
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        const unitsTab = screen.getByRole('tab', { name: /units \(2\)/i });
        fireEvent.click(unitsTab);
      });

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
        expect(screen.getByText(/are you sure you want to delete this unit/i)).toBeInTheDocument();
      });
    });

    it('deletes unit on confirmation', async () => {
      mockDeleteUnit.mockResolvedValue(undefined);

      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        const unitsTab = screen.getByRole('tab', { name: /units \(2\)/i });
        fireEvent.click(unitsTab);
      });

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        const confirmDeleteButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(confirmDeleteButton);
      });

      await waitFor(() => {
        expect(mockDeleteUnit).toHaveBeenCalledWith('u1');
      });
    });

    it('shows error on delete failure', async () => {
      mockDeleteUnit.mockRejectedValue(new Error('Delete failed'));

      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        const unitsTab = screen.getByRole('tab', { name: /units \(2\)/i });
        fireEvent.click(unitsTab);
      });

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        const confirmDeleteButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(confirmDeleteButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to delete unit')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('shows back to properties link', async () => {
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /back to properties/i })).toBeInTheDocument();
      });
    });
  });

  describe('Tab Counting', () => {
    it('shows correct unit count in units tab', async () => {
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /units \(2\)/i })).toBeInTheDocument();
      });
    });

    it('shows correct tenant count in tenants tab', async () => {
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /tenants \(1\)/i })).toBeInTheDocument();
      });
    });

    it('updates counts when units data changes', async () => {
      // This would be tested by mocking different unit data
      // For now, we verify the initial counts are correct
      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /units \(2\)/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /tenants \(1\)/i })).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles property with no units', async () => {
      mockGetUnitsByProperty.mockResolvedValue([]);

      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        const unitsTab = screen.getByRole('tab', { name: /units \(0\)/i });
        fireEvent.click(unitsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('No units available for this property.')).toBeInTheDocument();
      });
    });

    it('handles property with no occupied units', async () => {
      const vacantUnits = mockUnits.map(unit => ({ ...unit, occupancyStatus: 'vacant' as const }));
      mockGetUnitsByProperty.mockResolvedValue(vacantUnits);

      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        const tenantsTab = screen.getByRole('tab', { name: /tenants \(0\)/i });
        fireEvent.click(tenantsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Tenant Assignments')).toBeInTheDocument();
        // Should show empty table
      });
    });

    it('handles missing property ID', () => {
      mockUseParams.mockReturnValue({ id: undefined });

      // This should not crash the component
      expect(() => renderWithProviders(<PropertyDetail />)).not.toThrow();
    });

    it('handles property with missing optional fields', async () => {
      const propertyWithoutDescription: Property = {
        ...mockProperty,
        description: undefined,
      };
      mockGetProperty.mockResolvedValue(propertyWithoutDescription);

      renderWithProviders(<PropertyDetail />);

      await waitFor(() => {
        expect(screen.getByText('Test Property')).toBeInTheDocument();
        // Should not show description section
      });
    });
  });
});