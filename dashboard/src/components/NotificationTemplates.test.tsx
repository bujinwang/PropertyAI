import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationTemplates from './NotificationTemplates';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getNotificationTemplates: jest.fn(),
    createNotificationTemplate: jest.fn(),
    updateNotificationTemplate: jest.fn(),
    deleteNotificationTemplate: jest.fn(),
  },
}));

const mockGetNotificationTemplates = dashboardService.getNotificationTemplates as jest.MockedFunction<typeof dashboardService.getNotificationTemplates>;
const mockCreateNotificationTemplate = dashboardService.createNotificationTemplate as jest.MockedFunction<typeof dashboardService.createNotificationTemplate>;
const mockUpdateNotificationTemplate = dashboardService.updateNotificationTemplate as jest.MockedFunction<typeof dashboardService.updateNotificationTemplate>;
const mockDeleteNotificationTemplate = dashboardService.deleteNotificationTemplate as jest.MockedFunction<typeof dashboardService.deleteNotificationTemplate>;

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('NotificationTemplates', () => {
  beforeEach(() => {
    mockGetNotificationTemplates.mockResolvedValue({ data: [], total: 0 });
  });

  it('renders the component with create button', async () => {
    renderWithProviders(<NotificationTemplates />);

    await waitFor(() => {
      expect(screen.getByText('Notification Templates')).toBeInTheDocument();
    });

    expect(screen.getByText('Create Template')).toBeInTheDocument();
  });

  it('opens create template dialog', async () => {
    renderWithProviders(<NotificationTemplates />);

    await waitFor(() => {
      expect(screen.getByText('Notification Templates')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Template');
    fireEvent.click(createButton);

    expect(screen.getByText('Create Template')).toBeInTheDocument();
  });

  it('displays templates in table', async () => {
    const mockTemplates = [
      {
        id: '1',
        name: 'Welcome Template',
        type: 'announcement' as const,
        subject: 'Welcome to our property',
        content: 'Welcome message content',
        variables: ['tenantName', 'propertyAddress'],
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        usageCount: 5,
      },
    ];

    mockGetNotificationTemplates.mockResolvedValue({ data: mockTemplates, total: 1 });

    renderWithProviders(<NotificationTemplates />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Template')).toBeInTheDocument();
    });

    expect(screen.getByText('Welcome to our property')).toBeInTheDocument();
    expect(screen.getByText('announcement')).toBeInTheDocument();
  });

  it('creates a new template', async () => {
    mockCreateNotificationTemplate.mockResolvedValue({
      id: '1',
      name: 'New Template',
      type: 'announcement' as const,
      subject: 'New Subject',
      content: 'New Content',
      variables: [],
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    });

    renderWithProviders(<NotificationTemplates />);

    await waitFor(() => {
      expect(screen.getByText('Notification Templates')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Template');
    fireEvent.click(createButton);

    // Fill form
    fireEvent.change(screen.getByLabelText('Template Name'), {
      target: { value: 'New Template' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'New Subject' },
    });
    fireEvent.change(screen.getByLabelText('Content'), {
      target: { value: 'New Content' },
    });

    const createDialogButton = screen.getAllByText('Create')[1]; // Second "Create" button in dialog
    fireEvent.click(createDialogButton);

    await waitFor(() => {
      expect(mockCreateNotificationTemplate).toHaveBeenCalledWith({
        name: 'New Template',
        type: 'announcement',
        subject: 'New Subject',
        content: 'New Content',
        variables: [],
      });
    });
  });
});