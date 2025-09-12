import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FolderTree from '../FolderTree';
import { dashboardService } from '../../services/dashboardService';

// Mock the dashboard service
jest.mock('../../services/dashboardService', () => ({
  dashboardService: {
    getFolders: jest.fn(),
    createFolder: jest.fn(),
    updateFolder: jest.fn(),
    deleteFolder: jest.fn(),
  },
}));

const mockGetFolders = dashboardService.getFolders as jest.MockedFunction<typeof dashboardService.getFolders>;
const mockCreateFolder = dashboardService.createFolder as jest.MockedFunction<typeof dashboardService.createFolder>;

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

describe('FolderTree', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders folder tree with create button', () => {
    mockGetFolders.mockResolvedValue([]);

    renderWithProviders(<FolderTree />);

    expect(screen.getByText('Folders')).toBeInTheDocument();
    expect(screen.getByTitle('Create new folder')).toBeInTheDocument();
  });

  it('displays folders in tree structure', async () => {
    const mockFolders = [
      {
        id: '1',
        name: 'Root Folder',
        parentId: undefined,
        createdBy: 'user1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '2',
        name: 'Sub Folder',
        parentId: '1',
        createdBy: 'user1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    mockGetFolders.mockResolvedValue(mockFolders);

    renderWithProviders(<FolderTree />);

    await waitFor(() => {
      expect(screen.getByText('Root Folder')).toBeInTheDocument();
      expect(screen.getByText('Sub Folder')).toBeInTheDocument();
    });
  });

  it('opens create folder dialog', () => {
    mockGetFolders.mockResolvedValue([]);

    renderWithProviders(<FolderTree />);

    const createButton = screen.getByTitle('Create new folder');
    fireEvent.click(createButton);

    expect(screen.getByText('Create New Folder')).toBeInTheDocument();
    expect(screen.getByLabelText('Folder Name')).toBeInTheDocument();
  });

  it('creates new folder', async () => {
    mockGetFolders.mockResolvedValue([]);
    mockCreateFolder.mockResolvedValue({
      id: '3',
      name: 'New Folder',
      parentId: undefined,
      createdBy: 'user1',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    });

    renderWithProviders(<FolderTree />);

    const createButton = screen.getByTitle('Create new folder');
    fireEvent.click(createButton);

    const nameInput = screen.getByLabelText('Folder Name');
    const createBtn = screen.getByText('Create');

    fireEvent.change(nameInput, { target: { value: 'New Folder' } });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(mockCreateFolder).toHaveBeenCalledWith({
        name: 'New Folder',
        parentId: undefined,
      });
    });
  });

  it('shows loading state', () => {
    mockGetFolders.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<FolderTree />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    mockGetFolders.mockRejectedValue(new Error('Failed to load folders'));

    renderWithProviders(<FolderTree />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load folders/i)).toBeInTheDocument();
    });
  });

  it('calls onFolderSelect when folder is selected', async () => {
    const mockFolders = [
      {
        id: '1',
        name: 'Test Folder',
        parentId: undefined,
        createdBy: 'user1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    mockGetFolders.mockResolvedValue(mockFolders);
    const mockOnSelect = jest.fn();

    renderWithProviders(<FolderTree onFolderSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Test Folder')).toBeInTheDocument();
    });

    const folderItem = screen.getByText('Test Folder');
    fireEvent.click(folderItem);

    expect(mockOnSelect).toHaveBeenCalledWith('1');
  });
});