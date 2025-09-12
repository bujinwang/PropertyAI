import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AnnouncementCompose from './AnnouncementCompose';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getNotificationTemplates: jest.fn(),
    getProperties: jest.fn(),
    getTenants: jest.fn(),
    createAnnouncement: jest.fn(),
  },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

// Mock MUI date pickers
jest.mock('@mui/x-date-pickers', () => ({
  DateTimePicker: ({ label }: any) => <div data-testid={`datetime-picker-${label}`} />,
  LocalizationProvider: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@mui/x-date-pickers/AdapterDateFns');

const mockGetNotificationTemplates = dashboardService.getNotificationTemplates as jest.MockedFunction<typeof dashboardService.getNotificationTemplates>;
const mockGetProperties = dashboardService.getProperties as jest.MockedFunction<typeof dashboardService.getProperties>;
const mockGetTenants = dashboardService.getTenants as jest.MockedFunction<typeof dashboardService.getTenants>;
const mockCreateAnnouncement = dashboardService.createAnnouncement as jest.MockedFunction<typeof dashboardService.createAnnouncement>;
const mockNavigate = jest.fn();

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

describe('AnnouncementCompose', () => {
  beforeEach(() => {
    mockGetNotificationTemplates.mockResolvedValue({ data: [], total: 0 });
    mockGetProperties.mockResolvedValue({ data: [], total: 0, page: 1 });
    mockGetTenants.mockResolvedValue({ data: [], total: 0 });
    mockNavigate.mockClear();
  });

  it('renders the form with required fields', async () => {
    renderWithProviders(<AnnouncementCompose />);

    await waitFor(() => {
      expect(screen.getByText('Create Announcement')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Announcement Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Announcement Content')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<AnnouncementCompose />);

    await waitFor(() => {
      expect(screen.getByText('Create Announcement')).toBeInTheDocument();
    });

    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    mockCreateAnnouncement.mockResolvedValue({
      id: '1',
      title: 'Test Announcement',
      content: 'Test content',
      recipientGroups: ['all-tenants'],
      priority: 'medium',
      status: 'published',
      publishedAt: '2023-01-01T00:00:00Z',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    });

    renderWithProviders(<AnnouncementCompose />);

    await waitFor(() => {
      expect(screen.getByText('Create Announcement')).toBeInTheDocument();
    });

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Announcement Title'), {
      target: { value: 'Test Announcement' },
    });
    fireEvent.change(screen.getByLabelText('Announcement Content'), {
      target: { value: 'Test content' },
    });

    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(mockCreateAnnouncement).toHaveBeenCalledWith({
        title: 'Test Announcement',
        content: 'Test content',
        recipientGroups: [],
        propertyIds: [],
        tenantIds: [],
        priority: 'medium',
        scheduledAt: undefined,
        expiresAt: undefined,
      });
    });
  });

  it('navigates back on cancel', async () => {
    renderWithProviders(<AnnouncementCompose />);

    await waitFor(() => {
      expect(screen.getByText('Create Announcement')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/notifications');
  });
});