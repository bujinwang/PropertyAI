import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../design-system/theme';
import MessageInbox from './MessageInbox';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboardService
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getMessageThreads: jest.fn(),
  },
}));

const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('MessageInbox', () => {
  const mockOnThreadSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the inbox header and search', () => {
    mockDashboardService.getMessageThreads.mockResolvedValue({
      data: [],
      total: 0,
    });

    renderWithProviders(<MessageInbox onThreadSelect={mockOnThreadSelect} />);

    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockDashboardService.getMessageThreads.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<MessageInbox onThreadSelect={mockOnThreadSelect} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays empty state when no messages', async () => {
    mockDashboardService.getMessageThreads.mockResolvedValue({
      data: [],
      total: 0,
    });

    renderWithProviders(<MessageInbox onThreadSelect={mockOnThreadSelect} />);

    await waitFor(() => {
      expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });
  });

  it('displays message threads', async () => {
    const mockThreads = [
      {
        id: '1',
        subject: 'Test Subject',
        participants: ['user1', 'user2'],
        participantNames: ['John Doe', 'Jane Smith'],
        lastMessageAt: '2024-01-01T10:00:00Z',
        lastMessagePreview: 'This is a test message',
        unreadCount: 2,
        messageCount: 5,
        createdAt: '2024-01-01T09:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      },
    ];

    mockDashboardService.getMessageThreads.mockResolvedValue({
      data: mockThreads,
      total: 1,
    });

    renderWithProviders(<MessageInbox onThreadSelect={mockOnThreadSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Test Subject')).toBeInTheDocument();
      expect(screen.getByText('John Doe, Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('This is a test message')).toBeInTheDocument();
    });
  });

  it('calls onThreadSelect when thread is clicked', async () => {
    const mockThreads = [
      {
        id: '1',
        subject: 'Test Subject',
        participants: ['user1'],
        participantNames: ['John Doe'],
        lastMessageAt: '2024-01-01T10:00:00Z',
        lastMessagePreview: 'Test message',
        unreadCount: 0,
        messageCount: 1,
        createdAt: '2024-01-01T09:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      },
    ];

    mockDashboardService.getMessageThreads.mockResolvedValue({
      data: mockThreads,
      total: 1,
    });

    renderWithProviders(<MessageInbox onThreadSelect={mockOnThreadSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Test Subject')).toBeInTheDocument();
    });

    const threadButton = screen.getByRole('button', { name: /Conversation with John Doe/ });
    fireEvent.click(threadButton);

    expect(mockOnThreadSelect).toHaveBeenCalledWith('1');
  });

  it('filters threads based on search query', async () => {
    mockDashboardService.getMessageThreads.mockResolvedValue({
      data: [],
      total: 0,
    });

    renderWithProviders(<MessageInbox onThreadSelect={mockOnThreadSelect} />);

    const searchInput = screen.getByPlaceholderText('Search conversations...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    await waitFor(() => {
      expect(mockDashboardService.getMessageThreads).toHaveBeenCalledWith(
        1,
        50,
        'test search'
      );
    });
  });
});