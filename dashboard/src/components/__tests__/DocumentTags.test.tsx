import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DocumentTags from '../DocumentTags';
import { dashboardService } from '../../services/dashboardService';

// Mock the dashboard service
jest.mock('../../services/dashboardService', () => ({
  dashboardService: {
    addTags: jest.fn(),
    bulkTagDocuments: jest.fn(),
  },
}));

const mockAddTags = dashboardService.addTags as jest.MockedFunction<typeof dashboardService.addTags>;
const mockBulkTag = dashboardService.bulkTagDocuments as jest.MockedFunction<typeof dashboardService.bulkTagDocuments>;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
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

const mockDocuments = [
  {
    id: '1',
    name: 'Test Document.pdf',
    tags: ['existing-tag'],
    uploadedAt: '2024-01-01T00:00:00Z',
    uploadedBy: 'user1',
    fileType: 'application/pdf',
    fileSize: 1024,
    folderId: undefined,
    sharedWith: [],
    version: 1,
    permissions: 'private' as const,
    description: '',
    fileUrl: '',
    updatedAt: '',
  },
];

describe('DocumentTags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tag management interface', () => {
    renderWithProviders(<DocumentTags documents={mockDocuments} />);

    expect(screen.getByText('Document Tags')).toBeInTheDocument();
    expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
    expect(screen.getByText('existing-tag')).toBeInTheDocument();
  });

  it('shows bulk actions when documents are selected', () => {
    renderWithProviders(<DocumentTags documents={mockDocuments} />);

    expect(screen.getByText('Bulk Tag')).toBeInTheDocument();
    expect(screen.getByText('Manage Tags')).toBeInTheDocument();
  });

  it('opens bulk tag dialog', () => {
    renderWithProviders(<DocumentTags documents={mockDocuments} />);

    const bulkTagButton = screen.getByText('Bulk Tag');
    fireEvent.click(bulkTagButton);

    expect(screen.getByText('Bulk Tag Documents')).toBeInTheDocument();
    expect(screen.getByText('Add tags to 1 selected documents')).toBeInTheDocument();
  });

  it('adds tag to document', async () => {
    mockAddTags.mockResolvedValue({
      ...mockDocuments[0],
      tags: ['existing-tag', 'new-tag'],
    });

    renderWithProviders(<DocumentTags documents={mockDocuments} />);

    const addTagInput = screen.getByPlaceholderText('Add tag...');
    const addButton = screen.getByTitle('Add tag');

    fireEvent.change(addTagInput, { target: { value: 'new-tag' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockAddTags).toHaveBeenCalledWith('1', ['new-tag']);
    });
  });

  it('removes tag from document', async () => {
    mockAddTags.mockResolvedValue({
      ...mockDocuments[0],
      tags: [],
    });

    renderWithProviders(<DocumentTags documents={mockDocuments} />);

    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockAddTags).toHaveBeenCalledWith('1', []);
    });
  });

  it('performs bulk tag operation', async () => {
    mockBulkTag.mockResolvedValue([]);

    renderWithProviders(<DocumentTags documents={mockDocuments} />);

    const bulkTagButton = screen.getByText('Bulk Tag');
    fireEvent.click(bulkTagButton);

    const tagInput = screen.getByLabelText('Select tags');
    fireEvent.change(tagInput, { target: { value: 'bulk-tag' } });

    const applyButton = screen.getByText('Apply Tags');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockBulkTag).toHaveBeenCalledWith(['1'], ['bulk-tag']);
    });
  });

  it('shows tag statistics', () => {
    const documentsWithStats = [
      { ...mockDocuments[0], tags: ['tag1', 'tag2'] },
      {
        ...mockDocuments[0],
        id: '2',
        name: 'Another Document.pdf',
        tags: ['tag1', 'tag3'],
      },
    ];

    renderWithProviders(<DocumentTags documents={documentsWithStats} />);

    expect(screen.getByText('Tag Statistics')).toBeInTheDocument();
    expect(screen.getByText('tag1 (2)')).toBeInTheDocument();
    expect(screen.getByText('tag2 (1)')).toBeInTheDocument();
    expect(screen.getByText('tag3 (1)')).toBeInTheDocument();
  });

  it('shows read-only mode', () => {
    renderWithProviders(<DocumentTags documents={mockDocuments} readOnly />);

    expect(screen.queryByText('Bulk Tag')).not.toBeInTheDocument();
    expect(screen.queryByText('Manage Tags')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Add tag...')).not.toBeInTheDocument();
  });

  it('shows empty state when no documents', () => {
    renderWithProviders(<DocumentTags documents={[]} />);

    expect(screen.getByText('No documents selected')).toBeInTheDocument();
  });

  it('opens manage tags dialog', () => {
    renderWithProviders(<DocumentTags documents={mockDocuments} />);

    const manageTagsButton = screen.getByText('Manage Tags');
    fireEvent.click(manageTagsButton);

    expect(screen.getByText('Manage Tags')).toBeInTheDocument();
    expect(screen.getByText('View and manage all available tags')).toBeInTheDocument();
  });
});