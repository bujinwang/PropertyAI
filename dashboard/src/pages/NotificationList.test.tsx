import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationList from './NotificationList';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getNotifications: jest.fn(),
  },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

const mockGetNotifications = dashboardService.getNotifications as jest.MockedFunction<typeof dashboardService.getNotifications>;

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

describe('NotificationList', () => {
  beforeEach(() => {
    mockGetNotifications.mockClear();
  });

  it('renders loading state initially', () => {
    mockGetNotifications.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<NotificationList />);

    expect(screen.getByText('Notifications & Announcements')).toBeInTheDocument();
  });

  it('renders notifications when data is loaded', async () => {
    const mockNotifications = [
      {
        id: '1',
        type: 'announcement' as const,
        title: 'Test Announcement',
        message: 'This is a test message',
        recipientIds: ['user1', 'user2'],
        senderId: 'admin',
        priority: 'medium' as const,
        status: 'sent' as const,
        scheduledAt: undefined,
        sentAt: '2023-01-01T00:00:00Z',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        senderName: 'Admin User',
        recipientNames: ['User 1', 'User 2'],
      },
    ];

    mockGetNotifications.mockResolvedValue({
      data: mockNotifications,
      total: 1,
    });

    renderWithProviders(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByText('Test Announcement')).toBeInTheDocument();
    });

    expect(screen.getByText('This is a test message...')).toBeInTheDocument();
    expect(screen.getByText('announcement')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    mockGetNotifications.mockResolvedValue({
      data: [],
      total: 0,
    });

    renderWithProviders(<NotificationList />);

    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalled();
    });

    const searchInput = screen.getByLabelText('Search Notifications');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    // Wait for debounce and check if API was called with search term
    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalledWith(
        1,
        10,
        expect.objectContaining({ search: 'test search' })
      );
    });
  });

  it('handles type filter change', async () => {
    mockGetNotifications.mockResolvedValue({
      data: [],
      total: 0,
    });

    renderWithProviders(<NotificationList />);

    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalled();
    });

    const typeSelect = screen.getByLabelText('Type');
    fireEvent.mouseDown(typeSelect);
    const announcementOption = screen.getByText('Announcement');
    fireEvent.click(announcementOption);

    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalledWith(
        1,
        10,
        expect.objectContaining({ type: 'announcement' })
      );
    });
  });

  it('displays error message when API fails', async () => {
    mockGetNotifications.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch notifications')).toBeInTheDocument();
    });
  });
});