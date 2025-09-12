import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import userEvent from '@testing-library/user-event';
import theme from '../design-system/theme';
import DocumentList from './DocumentList';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  ...jest.requireActual('../services/dashboardService'),
  dashboardService: {
    getDocuments: jest.fn(),
    deleteDocument: jest.fn(),
    downloadDocument: jest.fn(),
  },
}));

const mockGetDocuments = dashboardService.getDocuments as jest.MockedFunction<typeof dashboardService.getDocuments>;
const mockDeleteDocument = dashboardService.deleteDocument as jest.MockedFunction<typeof dashboardService.deleteDocument>;
const mockDownloadDocument = dashboardService.downloadDocument as jest.MockedFunction<typeof dashboardService.downloadDocument>;

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
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
        {component}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('DocumentList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    mockGetDocuments.mockReturnValue(new Promise(() => {})); // Simulate loading

    renderWithProviders(<DocumentList />);

    expect(screen.getByText('Document Management')).toBeInTheDocument();
    // Should show loading state
  });

  it('renders error state', async () => {
    const error = new Error('API error');
    mockGetDocuments.mockRejectedValue(error);

    renderWithProviders(<DocumentList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch documents')).toBeInTheDocument();
    });
  });

  it('renders empty state', async () => {
    mockGetDocuments.mockResolvedValue({ data: [], total: 0 });

    renderWithProviders(<DocumentList />);

    await waitFor(() => {
      expect(screen.getByText('Document Management')).toBeInTheDocument();
      // Table should be empty
    });
  });

  it('renders documents table with data', async () => {
    const mockDocuments = [
      {
        id: '1',
        name: 'Lease Agreement.pdf',
        description: 'Standard lease agreement',
        fileUrl: 'https://example.com/lease.pdf',
        fileType: 'application/pdf',
        fileSize: 1024000,
        uploadedBy: 'user1',
        uploadedByName: 'John Doe',
        tags: ['lease', 'agreement'],
        uploadedAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        propertyId: 'p1',
        propertyName: 'Main Property',
      },
      {
        id: '2',
        name: 'Maintenance Report.docx',
        description: 'Monthly maintenance report',
        fileUrl: 'https://example.com/report.docx',
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 512000,
        uploadedBy: 'user2',
        uploadedByName: 'Jane Smith',
        tags: ['maintenance', 'report'],
        uploadedAt: '2024-01-02T10:00:00Z',
        updatedAt: '2024-01-02T10:00:00Z',
        maintenanceId: 'm1',
        maintenanceTitle: 'Plumbing Repair',
      },
    ];
    mockGetDocuments.mockResolvedValue({ data: mockDocuments, total: 2 });

    renderWithProviders(<DocumentList />);

    await waitFor(() => {
      expect(screen.getByText('Document Management')).toBeInTheDocument();
      expect(screen.getByText('Lease Agreement.pdf')).toBeInTheDocument();
      expect(screen.getByText('Maintenance Report.docx')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Property: Main Property')).toBeInTheDocument();
      expect(screen.getByText('Maintenance: Plumbing Repair')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    mockGetDocuments.mockResolvedValue({ data: [], total: 0 });

    renderWithProviders(<DocumentList />);

    const searchInput = screen.getByLabelText('Search Documents');
    fireEvent.change(searchInput, { target: { value: 'lease' } });

    await waitFor(() => {
      expect(mockGetDocuments).toHaveBeenCalledWith(1, 10, expect.objectContaining({
        search: 'lease',
      }));
    });
  });

  it('handles filter functionality', async () => {
    mockGetDocuments.mockResolvedValue({ data: [], total: 0 });

    renderWithProviders(<DocumentList />);

    const typeFilter = screen.getByLabelText('File Type');
    fireEvent.change(typeFilter, { target: { value: 'pdf' } });

    await waitFor(() => {
      expect(mockGetDocuments).toHaveBeenCalledWith(1, 10, expect.objectContaining({
        type: 'pdf',
      }));
    });
  });

  it('handles pagination', async () => {
    mockGetDocuments.mockResolvedValue({ data: [], total: 25 });

    renderWithProviders(<DocumentList />);

    await waitFor(() => {
      expect(mockGetDocuments).toHaveBeenCalledWith(1, 10, expect.any(Object));
    });

    // This would require more complex setup to test pagination clicks
    // For now, we verify the initial call
  });

  it('handles document download', async () => {
    const mockDocuments = [
      {
        id: '1',
        name: 'Test Document.pdf',
        description: 'Test description',
        fileUrl: 'https://example.com/test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        uploadedBy: 'user1',
        uploadedByName: 'John Doe',
        tags: [],
        uploadedAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      },
    ];
    mockGetDocuments.mockResolvedValue({ data: mockDocuments, total: 1 });
    mockDownloadDocument.mockResolvedValue(new Blob(['test content']));

    // Mock URL.createObjectURL and related functions
    const mockCreateObjectURL = jest.fn(() => 'mock-url');
    const mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock document methods
    const mockClick = jest.fn();
    const mockCreateElement = jest.fn(() => ({
      click: mockClick,
      setAttribute: jest.fn(),
      style: {},
    }));
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    (globalThis as any).document = {
      createElement: mockCreateElement,
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    };

    renderWithProviders(<DocumentList />);

    await waitFor(() => {
      expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
    });

    const downloadButton = screen.getByLabelText('Download document');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockDownloadDocument).toHaveBeenCalledWith('1');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  it('handles document deletion', async () => {
    const mockDocuments = [
      {
        id: '1',
        name: 'Test Document.pdf',
        description: 'Test description',
        fileUrl: 'https://example.com/test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        uploadedBy: 'user1',
        uploadedByName: 'John Doe',
        tags: [],
        uploadedAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      },
    ];
    mockGetDocuments.mockResolvedValue({ data: mockDocuments, total: 1 });
    mockDeleteDocument.mockResolvedValue();

    renderWithProviders(<DocumentList />);

    await waitFor(() => {
      expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('Delete document');
    fireEvent.click(deleteButton);

    // Confirm deletion dialog should appear
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteDocument).toHaveBeenCalledWith('1');
    });
  });

  it('formats file sizes correctly', async () => {
    const mockDocuments = [
      {
        id: '1',
        name: 'Small File.txt',
        description: 'Small file',
        fileUrl: 'https://example.com/small.txt',
        fileType: 'text/plain',
        fileSize: 1024, // 1KB
        uploadedBy: 'user1',
        uploadedByName: 'John Doe',
        tags: [],
        uploadedAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      },
      {
        id: '2',
        name: 'Large File.pdf',
        description: 'Large file',
        fileUrl: 'https://example.com/large.pdf',
        fileType: 'application/pdf',
        fileSize: 1048576, // 1MB
        uploadedBy: 'user1',
        uploadedByName: 'John Doe',
        tags: [],
        uploadedAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      },
    ];
    mockGetDocuments.mockResolvedValue({ data: mockDocuments, total: 2 });

    renderWithProviders(<DocumentList />);

    await waitFor(() => {
      expect(screen.getByText('1.00 KB')).toBeInTheDocument();
      expect(screen.getByText('1.00 MB')).toBeInTheDocument();
    });
  });
});