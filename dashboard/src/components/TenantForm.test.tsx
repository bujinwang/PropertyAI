import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import userEvent from '@testing-library/user-event';
import theme from '../design-system/theme';
import TenantForm from './TenantForm';
import { dashboardService, Tenant } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  ...jest.requireActual('../services/dashboardService'),
  dashboardService: {
    createTenant: jest.fn(),
    updateTenant: jest.fn(),
  },
}));

const mockCreateTenant = dashboardService.createTenant as jest.MockedFunction<typeof dashboardService.createTenant>;
const mockUpdateTenant = dashboardService.updateTenant as jest.MockedFunction<typeof dashboardService.updateTenant>;

const renderTenantForm = (props: Partial<Parameters<typeof TenantForm>[0]> = {}) => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onSubmitSuccess: jest.fn(),
    initialValues: {},
    isEdit: false,
    tenantId: undefined,
  };
  return render(
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <TenantForm {...defaultProps} {...props} />
      </LocalizationProvider>
    </ThemeProvider>
  );
};

describe('TenantForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateTenant.mockResolvedValue({ id: 'new' } as Tenant);
    mockUpdateTenant.mockResolvedValue({ id: 'updated' } as Tenant);
  });

  it('renders form fields when open', () => {
    renderTenantForm();

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lease start/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lease end/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('closes form on cancel click', async () => {
    const mockOnClose = jest.fn();
    renderTenantForm({ onClose: mockOnClose });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows validation errors on submit with invalid data', async () => {
    renderTenantForm();

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is a required field/i)).toBeInTheDocument();
      expect(screen.getByText(/email is a required field/i)).toBeInTheDocument();
      expect(screen.getByText(/lease start is a required field/i)).toBeInTheDocument();
      expect(screen.getByText(/status is a required field/i)).toBeInTheDocument();
    });
  });

  it('shows email validation error on invalid email', async () => {
    renderTenantForm();

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is not a valid email/i)).toBeInTheDocument();
    });
  });

  it('shows date validation error if leaseEnd before leaseStart', async () => {
    renderTenantForm();

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Tenant' } });

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const statusSelect = screen.getByLabelText(/status/i);
    fireEvent.change(statusSelect, { target: { value: 'active' } });

    // Set leaseStart to tomorrow
    const leaseStartInput = screen.getByLabelText(/lease start/i);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await userEvent.type(leaseStartInput, tomorrow.toISOString().split('T')[0]);

    // Set leaseEnd to today (before start)
    const leaseEndInput = screen.getByLabelText(/lease end/i);
    const today = new Date();
    await userEvent.type(leaseEndInput, today.toISOString().split('T')[0]);

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/lease end must be after lease start/i)).toBeInTheDocument();
    });
  });

  it('submits create tenant with valid data and calls onSubmitSuccess', async () => {
    const mockOnSubmitSuccess = jest.fn();
    renderTenantForm({ onSubmitSuccess: mockOnSubmitSuccess });

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'New Tenant' } });

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

    const phoneInput = screen.getByLabelText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: '123-456-7890' } });

    const leaseStartInput = screen.getByLabelText(/lease start/i);
    const today = new Date().toISOString().split('T')[0];
    await userEvent.type(leaseStartInput, today);

    const leaseEndInput = screen.getByLabelText(/lease end/i);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 365);
    await userEvent.type(leaseEndInput, futureDate.toISOString().split('T')[0]);

    const statusSelect = screen.getByLabelText(/status/i);
    fireEvent.change(statusSelect, { target: { value: 'pending' } });

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateTenant).toHaveBeenCalledWith({
        name: 'New Tenant',
        email: 'new@example.com',
        phone: '123-456-7890',
        leaseStart: expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
        leaseEnd: expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
        status: 'pending',
      });
      expect(mockOnSubmitSuccess).toHaveBeenCalled();
    });
  });

  it('submits update tenant with initialValues and calls onSubmitSuccess', async () => {
    const mockOnSubmitSuccess = jest.fn();
    const initialTenant: Partial<Tenant> = {
      id: '1',
      name: 'Existing Tenant',
      email: 'existing@example.com',
      status: 'active',
      leaseStart: '2024-01-01',
      leaseEnd: '2025-01-01',
    };
    renderTenantForm({ onSubmitSuccess: mockOnSubmitSuccess, initialValues: initialTenant, isEdit: true, tenantId: '1' });

    // Verify pre-filled values
    expect(screen.getByLabelText(/name/i)).toHaveValue('Existing Tenant');
    expect(screen.getByLabelText(/email/i)).toHaveValue('existing@example.com');
    expect(screen.getByLabelText(/status/i)).toHaveValue('active');

    // Change phone
    const phoneInput = screen.getByLabelText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: '987-654-3210' } });

    const submitButton = screen.getByRole('button', { name: /update/i }); // Assuming button text changes in edit mode
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateTenant).toHaveBeenCalledWith('1', {
        name: 'Existing Tenant',
        email: 'existing@example.com',
        phone: '987-654-3210',
        leaseStart: '2024-01-01',
        leaseEnd: '2025-01-01',
        status: 'active',
      });
      expect(mockOnSubmitSuccess).toHaveBeenCalled();
    });
  });

  it('does not submit if form is invalid', async () => {
    renderTenantForm();

    // Only fill name
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Test' } });

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateTenant).not.toHaveBeenCalled();
    });
  });
});