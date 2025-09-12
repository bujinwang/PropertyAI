import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from '../design-system/theme';
import AssignmentModal from './AssignmentModal';
import { dashboardService, UnitOption } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  ...jest.requireActual('../services/dashboardService'),
  dashboardService: {
    getVacantUnitOptions: jest.fn(),
    assignTenantToUnit: jest.fn(),
    unassignTenant: jest.fn(),
    bulkAssign: jest.fn(),
  },
}));

const mockGetVacantUnitOptions = dashboardService.getVacantUnitOptions as jest.MockedFunction<typeof dashboardService.getVacantUnitOptions>;
const mockAssignTenantToUnit = dashboardService.assignTenantToUnit as jest.MockedFunction<typeof dashboardService.assignTenantToUnit>;
const mockUnassignTenant = dashboardService.unassignTenant as jest.MockedFunction<typeof dashboardService.unassignTenant>;
const mockBulkAssign = dashboardService.bulkAssign as jest.MockedFunction<typeof dashboardService.bulkAssign>;

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

const mockUnitOptions: UnitOption[] = [
  { id: 'u1', unitNumber: '101', address: '123 Main St' },
  { id: 'u2', unitNumber: '102', address: '123 Main St' },
  { id: 'u3', unitNumber: '201', address: '456 Oak Ave' },
];

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  tenantId: 't1',
  tenantIds: [],
  unitId: 'u1',
  mode: 'assign' as const,
  propertyId: 'p1',
  onSubmit: jest.fn(),
};

describe('AssignmentModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetVacantUnitOptions.mockResolvedValue(mockUnitOptions);
  });

  describe('Render Tests', () => {
    it('renders assign mode with form fields', async () => {
      renderWithProviders(<AssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Assign Tenant to Unit')).toBeInTheDocument();
        expect(screen.getByLabelText(/select vacant unit/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/lease start/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/lease end/i)).toBeInTheDocument();
      });
    });

    it('renders unassign mode with confirmation', async () => {
      renderWithProviders(<AssignmentModal {...defaultProps} mode="unassign" />);

      await waitFor(() => {
        expect(screen.getByText('Unassign Tenant')).toBeInTheDocument();
        expect(screen.getByText(/confirm unassigning tenant/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /confirm unassign/i })).toBeInTheDocument();
      });
    });

    it('renders bulk mode with tenant chips and unit selection', async () => {
      const bulkProps = { ...defaultProps, mode: 'bulk' as const, tenantIds: ['t1', 't2'] };
      renderWithProviders(<AssignmentModal {...bulkProps} />);

      await waitFor(() => {
        expect(screen.getByText('Bulk Assignment')).toBeInTheDocument();
        expect(screen.getByText('Assigning 2 selected tenants')).toBeInTheDocument();
        expect(screen.getByText('Tenant t1')).toBeInTheDocument();
        expect(screen.getByText('Tenant t2')).toBeInTheDocument();
        expect(screen.getByLabelText(/select units/i)).toBeInTheDocument();
      });
    });

    it('fetches vacant unit options on open', async () => {
      renderWithProviders(<AssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetVacantUnitOptions).toHaveBeenCalledWith('p1');
      });
    });
  });

  describe('Selection Tests', () => {
    it('allows unit selection in assign mode', async () => {
      renderWithProviders(<AssignmentModal {...defaultProps} />);

      let unitSelect: HTMLElement;

      await waitFor(() => {
        unitSelect = screen.getByLabelText(/select vacant unit/i);
        fireEvent.mouseDown(unitSelect);
      });

      await waitFor(() => {
        expect(screen.getByText('101 - 123 Main St')).toBeInTheDocument();
        expect(screen.getByText('102 - 123 Main St')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('101 - 123 Main St'));

      expect(unitSelect!).toHaveValue('101 - 123 Main St');
    });

    it('allows multiple unit selection in bulk mode', async () => {
      const bulkProps = { ...defaultProps, mode: 'bulk' as const, tenantIds: ['t1'] };
      renderWithProviders(<AssignmentModal {...bulkProps} />);

      await waitFor(() => {
        const unitSelect = screen.getByLabelText(/select units/i);
        fireEvent.mouseDown(unitSelect);
      });

      fireEvent.click(screen.getByText('101 - 123 Main St'));
      fireEvent.click(screen.getByText('102 - 123 Main St'));

      expect(screen.getByText('101 - 123 Main St')).toBeInTheDocument();
      expect(screen.getByText('102 - 123 Main St')).toBeInTheDocument();
    });
  });

  describe('Validation Tests', () => {
    it('shows validation errors for required fields in assign mode', async () => {
      renderWithProviders(<AssignmentModal {...defaultProps} />);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /assign/i });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Unit is required')).toBeInTheDocument();
        expect(screen.getByText('Lease start is required')).toBeInTheDocument();
        expect(screen.getByText('Lease end is required')).toBeInTheDocument();
      });
    });

    it('validates lease end is after lease start', async () => {
      renderWithProviders(<AssignmentModal {...defaultProps} />);

      await waitFor(() => {
        // Select unit first
        const unitSelect = screen.getByLabelText(/select vacant unit/i);
        fireEvent.mouseDown(unitSelect);
        fireEvent.click(screen.getByText('101 - 123 Main St'));

        // Set lease start
        const leaseStartInput = screen.getByLabelText(/lease start/i);
        fireEvent.change(leaseStartInput, { target: { value: '2024-01-15' } });

        // Set lease end before start
        const leaseEndInput = screen.getByLabelText(/lease end/i);
        fireEvent.change(leaseEndInput, { target: { value: '2024-01-10' } });

        const submitButton = screen.getByRole('button', { name: /assign/i });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('End date must be after start')).toBeInTheDocument();
      });
    });

    it('requires at least one unit in bulk mode', async () => {
      const bulkProps = { ...defaultProps, mode: 'bulk' as const, tenantIds: ['t1'] };
      renderWithProviders(<AssignmentModal {...bulkProps} />);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /assign bulk/i });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('At least one unit required')).toBeInTheDocument();
      });
    });
  });

  describe('Submit Tests', () => {
    it('submits assign form with valid data', async () => {
      const mockOnSubmit = jest.fn();
      renderWithProviders(<AssignmentModal {...defaultProps} onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        // Select unit
        const unitSelect = screen.getByLabelText(/select vacant unit/i);
        fireEvent.mouseDown(unitSelect);
        fireEvent.click(screen.getByText('101 - 123 Main St'));

        // Set dates
        const leaseStartInput = screen.getByLabelText(/lease start/i);
        fireEvent.change(leaseStartInput, { target: { value: '2024-01-15' } });

        const leaseEndInput = screen.getByLabelText(/lease end/i);
        fireEvent.change(leaseEndInput, { target: { value: '2025-01-15' } });

        const submitButton = screen.getByRole('button', { name: /assign/i });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          unitId: 'u1',
          unitIds: undefined,
          leaseStart: expect.any(Date),
          leaseEnd: expect.any(Date),
          tenantId: 't1',
          tenantIds: undefined,
          mode: 'assign',
        });
      });
    });

    it('submits bulk assign form with valid data', async () => {
      const mockOnSubmit = jest.fn();
      const bulkProps = { ...defaultProps, mode: 'bulk' as const, tenantIds: ['t1', 't2'], onSubmit: mockOnSubmit };
      renderWithProviders(<AssignmentModal {...bulkProps} />);

      await waitFor(() => {
        // Select units
        const unitSelect = screen.getByLabelText(/select units/i);
        fireEvent.mouseDown(unitSelect);
        fireEvent.click(screen.getByText('101 - 123 Main St'));
        fireEvent.click(screen.getByText('102 - 123 Main St'));

        // Set dates
        const leaseStartInput = screen.getByLabelText(/lease start/i);
        fireEvent.change(leaseStartInput, { target: { value: '2024-01-15' } });

        const leaseEndInput = screen.getByLabelText(/lease end/i);
        fireEvent.change(leaseEndInput, { target: { value: '2025-01-15' } });

        const submitButton = screen.getByRole('button', { name: /assign bulk/i });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          unitId: '',
          unitIds: ['u1', 'u2'],
          leaseStart: expect.any(Date),
          leaseEnd: expect.any(Date),
          tenantId: 't1',
          tenantIds: ['t1', 't2'],
          mode: 'bulk',
        });
      });
    });

    it('handles unassign confirmation flow', async () => {
      const mockOnSubmit = jest.fn();
      renderWithProviders(<AssignmentModal {...defaultProps} mode="unassign" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm unassign/i });
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        const finalConfirmButton = screen.getByRole('button', { name: /confirm/i });
        fireEvent.click(finalConfirmButton);
      });

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          unitId: 'u1',
          unitIds: undefined,
          leaseStart: null,
          leaseEnd: null,
          tenantId: 't1',
          tenantIds: [],
          mode: 'unassign',
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles API error when fetching unit options', async () => {
      mockGetVacantUnitOptions.mockRejectedValue(new Error('Failed to fetch units'));
      renderWithProviders(<AssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch units')).toBeInTheDocument();
      });
    });

    it('disables submit button when form is invalid', async () => {
      renderWithProviders(<AssignmentModal {...defaultProps} />);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /assign/i });
        expect(submitButton).toBeDisabled();
      });
    });

    it('closes modal on cancel', async () => {
      const mockOnClose = jest.fn();
      renderWithProviders(<AssignmentModal {...defaultProps} onClose={mockOnClose} />);

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles empty unit options', async () => {
      mockGetVacantUnitOptions.mockResolvedValue([]);
      renderWithProviders(<AssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No options')).toBeInTheDocument();
      });
    });
  });
});