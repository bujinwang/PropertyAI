import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaymentForm from '../PaymentForm';
import { dashboardService } from '../../services/dashboardService';

// Mock dependencies
jest.mock('../../services/dashboardService');
jest.mock('../../utils/paymentUtils');

const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>;

describe('PaymentForm', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onSubmitSuccess: jest.fn(),
    tenantId: 'tenant_123',
    leaseId: 'lease_456',
    initialAmount: 1000,
    initialDescription: 'Monthly rent',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock payment methods
    mockDashboardService.getPaymentMethods.mockResolvedValue([
      {
        id: 'pm_1',
        tenantId: 'tenant_123',
        type: 'card',
        processor: 'stripe',
        last4: '4242',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'pm_2',
        tenantId: 'tenant_123',
        type: 'bank_account',
        processor: 'ach',
        last4: '1234',
        bankName: 'Test Bank',
        accountType: 'checking',
        isDefault: false,
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]);
  });

  it('renders the payment form correctly', async () => {
    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Process Payment')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Currency')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Payment Method')).toBeInTheDocument();
    expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument();
  });

  it('loads and displays payment methods', async () => {
    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(mockDashboardService.getPaymentMethods).toHaveBeenCalledWith('tenant_123');
    });

    expect(await screen.findByText('•••• •••• •••• 4242 (Visa)')).toBeInTheDocument();
    expect(screen.getByText('Bank Account ••••1234 (Test Bank)')).toBeInTheDocument();
  });

  it('shows loading state while fetching payment methods', async () => {
    mockDashboardService.getPaymentMethods.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    render(<PaymentForm {...defaultProps} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockDashboardService.getPaymentMethods).toHaveBeenCalledWith('tenant_123');
    });
  });

  it('displays error when payment methods fail to load', async () => {
    mockDashboardService.getPaymentMethods.mockRejectedValue(
      new Error('Failed to load payment methods')
    );

    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load payment methods')).toBeInTheDocument();
    });
  });

  it('shows no payment methods message when empty', async () => {
    mockDashboardService.getPaymentMethods.mockResolvedValue([]);

    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No payment methods available. Please add a payment method first.')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(mockDashboardService.getPaymentMethods).toHaveBeenCalledWith('tenant_123');
    });

    const submitButton = screen.getByText('Process Payment');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Amount is required')).toBeInTheDocument();
    });
  });

  it('validates amount format', async () => {
    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(mockDashboardService.getPaymentMethods).toHaveBeenCalledWith('tenant_123');
    });

    const amountInput = screen.getByLabelText('Amount');
    fireEvent.change(amountInput, { target: { value: '-100' } });

    const submitButton = screen.getByText('Process Payment');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Amount must be positive')).toBeInTheDocument();
    });
  });

  it('validates currency selection', async () => {
    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(mockDashboardService.getPaymentMethods).toHaveBeenCalledWith('tenant_123');
    });

    const currencySelect = screen.getByLabelText('Currency');
    fireEvent.mouseDown(currencySelect);

    await waitFor(() => {
      expect(screen.getByText('USD ($)')).toBeInTheDocument();
      expect(screen.getByText('EUR (€)')).toBeInTheDocument();
      expect(screen.getByText('GBP (£)')).toBeInTheDocument();
    });
  });

  it('submits payment successfully', async () => {
    const mockTransaction = {
      id: 'txn_123',
      tenantId: 'tenant_123',
      leaseId: 'lease_456',
      amount: 1000,
      currency: 'USD' as const,
      status: 'completed' as const,
      processor: 'stripe' as const,
      processorTransactionId: 'stripe_txn_123',
      paymentMethodId: 'pm_1',
      description: 'Monthly rent',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    mockDashboardService.processPayment.mockResolvedValue(mockTransaction);

    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(mockDashboardService.getPaymentMethods).toHaveBeenCalledWith('tenant_123');
    });

    // Fill out the form
    const amountInput = screen.getByLabelText('Amount');
    fireEvent.change(amountInput, { target: { value: '1000' } });

    const paymentMethodSelect = screen.getByLabelText('Select Payment Method');
    fireEvent.mouseDown(paymentMethodSelect);

    await waitFor(() => {
      const visaOption = screen.getByText('•••• •••• •••• 4242 (Visa)');
      fireEvent.click(visaOption);
    });

    const submitButton = screen.getByText('Process Payment');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockDashboardService.processPayment).toHaveBeenCalledWith({
        tenantId: 'tenant_123',
        leaseId: 'lease_456',
        amount: 1000,
        currency: 'USD',
        paymentMethodId: 'pm_1',
        description: 'Monthly rent',
      });
    });

    expect(defaultProps.onSubmitSuccess).toHaveBeenCalledWith(mockTransaction);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles payment processing errors', async () => {
    mockDashboardService.processPayment.mockRejectedValue(
      new Error('Payment processing failed')
    );

    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(mockDashboardService.getPaymentMethods).toHaveBeenCalledWith('tenant_123');
    });

    // Fill out the form minimally
    const amountInput = screen.getByLabelText('Amount');
    fireEvent.change(amountInput, { target: { value: '1000' } });

    const paymentMethodSelect = screen.getByLabelText('Select Payment Method');
    fireEvent.mouseDown(paymentMethodSelect);

    await waitFor(() => {
      const visaOption = screen.getByText('•••• •••• •••• 4242 (Visa)');
      fireEvent.click(visaOption);
    });

    const submitButton = screen.getByText('Process Payment');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Payment processing failed')).toBeInTheDocument();
    });

    expect(defaultProps.onSubmitSuccess).not.toHaveBeenCalled();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('disables submit button when processing', async () => {
    mockDashboardService.processPayment.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        id: 'txn_123',
        tenantId: 'tenant_123',
        leaseId: 'lease_456',
        amount: 1000,
        currency: 'USD' as const,
        status: 'completed' as const,
        processor: 'stripe' as const,
        processorTransactionId: 'stripe_txn_123',
        paymentMethodId: 'pm_1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }), 100))
    );

    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(mockDashboardService.getPaymentMethods).toHaveBeenCalledWith('tenant_123');
    });

    // Fill out the form
    const amountInput = screen.getByLabelText('Amount');
    fireEvent.change(amountInput, { target: { value: '1000' } });

    const paymentMethodSelect = screen.getByLabelText('Select Payment Method');
    fireEvent.mouseDown(paymentMethodSelect);

    await waitFor(() => {
      const visaOption = screen.getByText('•••• •••• •••• 4242 (Visa)');
      fireEvent.click(visaOption);
    });

    const submitButton = screen.getByText('Process Payment');
    fireEvent.click(submitButton);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('closes the dialog when cancel is clicked', () => {
    render(<PaymentForm {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('displays payment summary correctly', async () => {
    render(<PaymentForm {...defaultProps} />);

    await waitFor(() => {
      expect(mockDashboardService.getPaymentMethods).toHaveBeenCalledWith('tenant_123');
    });

    const amountInput = screen.getByLabelText('Amount');
    fireEvent.change(amountInput, { target: { value: '1500' } });

    await waitFor(() => {
      expect(screen.getByText('Payment Summary')).toBeInTheDocument();
      expect(screen.getByText('$1,500.00')).toBeInTheDocument();
      expect(screen.getByText('Monthly rent')).toBeInTheDocument();
    });
  });

  it('handles dialog close correctly', () => {
    const { rerender } = render(<PaymentForm {...defaultProps} />);

    // Close the dialog
    rerender(<PaymentForm {...defaultProps} open={false} />);

    expect(screen.queryByText('Process Payment')).not.toBeInTheDocument();
  });
});