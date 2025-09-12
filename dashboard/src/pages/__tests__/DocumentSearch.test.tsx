import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DocumentSearch from '../DocumentSearch';
import { dashboardService } from '../../services/dashboardService';

// Mock the dashboard service
jest.mock('../../services/dashboardService', () => ({
  dashboardService: {
    searchDocuments: jest.fn(),
    getDocuments: jest.fn(),
    getFolders: jest.fn(),
    bulkMoveDocuments: jest.fn(),
    bulkTagDocuments: jest.fn(),
    bulkDeleteDocuments: jest.fn(),
    shareDocument: jest.fn(),
  },
}));

// Mock the query client config
jest.mock('../../config/queryClient', () => ({
  queryKeys: {
    dashboard: {
      documents: jest.fn(() => ['documents']),
    },
  },
}));

const mockSearchDocuments = dashboardService.searchDocuments as jest.MockedFunction<typeof dashboardService.searchDocuments>;
const mockGetDocuments = dashboardService.getDocuments as jest.MockedFunction<typeof dashboardService.getDocuments>;
const mockGetFolders = dashboardService.getFolders as jest.MockedFunction<typeof dashboardService.getFolders>;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('DocumentSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFolders.mockResolvedValue([]);
  });

  it('renders search form and filters', () => {
    renderWithProviders(<DocumentSearch />);

    expect(screen.getByLabelText(/search documents/i)).toBeInTheDocument();
    expect(screen.getByText(/show filters/i)).toBeInTheDocument();
    expect(screen.getByText(/search/i)).toBeInTheDocument();
  });

  it('shows filters when show filters button is clicked', () => {
    renderWithProviders(<DocumentSearch />);

    const showFiltersButton = screen.getByText(/show filters/i);
    fireEvent.click(showFiltersButton);

    expect(screen.getByText(/hide filters/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/folder/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/file type/i)).toBeInTheDocument();
  });

  it('calls searchDocuments when search is performed', async () => {
    const mockResults = {
      data: [
        {
          id: '1',
          name: 'Test Document.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          tags: ['test'],
          uploadedAt: '2024-01-01T00:00:00Z',
          uploadedBy: 'user1',
          folderId: null,
          sharedWith: [],
          version: 1,
          permissions: 'private' as const,
          description: '',
          fileUrl: '',
          updatedAt: '',
        },
      ],
      total: 1,
    };

    mockSearchDocuments.mockResolvedValue(mockResults);

    renderWithProviders(<DocumentSearch />);

    const searchInput = screen.getByLabelText(/search documents/i);
    const searchButton = screen.getByText(/search/i);

    fireEvent.change(searchInput, { target: { value: 'test document' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockSearchDocuments).toHaveBeenCalledWith('test document', {});
    });
  });

  it('displays search results in table', async () => {
    const mockResults = {
      data: [
        {
          id: '1',
          name: 'Test Document.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          tags: ['test'],
          uploadedAt: '2024-01-01T00:00:00Z',
          uploadedBy: 'user1',
          folderId: undefined,
          sharedWith: [],
          version: 1,
          permissions: 'private' as const,
          description: '',
          fileUrl: '',
          updatedAt: '',
        },
      ],
      total: 1,
    };

    mockSearchDocuments.mockResolvedValue(mockResults);

    renderWithProviders(<DocumentSearch />);

    const searchInput = screen.getByLabelText(/search documents/i);
    const searchButton = screen.getByText(/search/i);

    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
      expect(screen.getByText('application/pdf')).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });

  it('shows no documents found message when no results', async () => {
    mockSearchDocuments.mockResolvedValue({ data: [], total: 0 });

    renderWithProviders(<DocumentSearch />);

    const searchInput = screen.getByLabelText(/search documents/i);
    const searchButton = screen.getByText(/search/i);

    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText(/no documents found/i)).toBeInTheDocument();
    });
  });

  it('handles bulk operations', async () => {
    const mockResults = {
      data: [
        {
          id: '1',
          name: 'Test Document.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          tags: ['test'],
          uploadedAt: '2024-01-01T00:00:00Z',
          uploadedBy: 'user1',
          folderId: null,
          sharedWith: [],
          version: 1,
          permissions: 'private' as const,
          description: '',
          fileUrl: '',
          updatedAt: '',
        },
      ],
      total: 1,
    };

    mockSearchDocuments.mockResolvedValue(mockResults);
    const mockBulkTag = dashboardService.bulkTagDocuments as jest.MockedFunction<typeof dashboardService.bulkTagDocuments>;
    mockBulkTag.mockResolvedValue([]);

    renderWithProviders(<DocumentSearch />);

    // Perform search to get results
    const searchInput = screen.getByLabelText(/search documents/i);
    const searchButton = screen.getByText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
    });

    // Select document
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Check bulk actions appear
    expect(screen.getByText(/bulk actions/i)).toBeInTheDocument();
    expect(screen.getByText(/1 selected/i)).toBeInTheDocument();
  });

  it('opens share dialog when share button is clicked', async () => {
    const mockResults = {
      data: [
        {
          id: '1',
          name: 'Test Document.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          tags: ['test'],
          uploadedAt: '2024-01-01T00:00:00Z',
          uploadedBy: 'user1',
          folderId: null,
          sharedWith: [],
          version: 1,
          permissions: 'private' as const,
          description: '',
          fileUrl: '',
          updatedAt: '',
        },
      ],
      total: 1,
    };

    mockSearchDocuments.mockResolvedValue(mockResults);

    renderWithProviders(<DocumentSearch />);

    // Perform search
    const searchInput = screen.getByLabelText(/search documents/i);
    const searchButton = screen.getByText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
    });

    // Click share button
    const shareButtons = screen.getAllByLabelText(/share/i);
    fireEvent.click(shareButtons[0]);

    expect(screen.getByText(/share document/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockSearchDocuments.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<DocumentSearch />);

    const searchInput = screen.getByLabelText(/search documents/i);
    const searchButton = screen.getByText(/search/i);

    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(searchButton);

    // Should show loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state', async () => {
    mockSearchDocuments.mockRejectedValue(new Error('Search failed'));

    renderWithProviders(<DocumentSearch />);

    const searchInput = screen.getByLabelText(/search documents/i);
    const searchButton = screen.getByText(/search/i);

    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to search documents/i)).toBeInTheDocument();
    });
  });
});