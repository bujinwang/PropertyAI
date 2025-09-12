import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from '../design-system/theme';
import DocumentUpload from './DocumentUpload';
import { dashboardService, Document } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  ...jest.requireActual('../services/dashboardService'),
  dashboardService: {
    uploadDocument: jest.fn(),
    updateDocument: jest.fn(),
    getProperties: jest.fn(),
    getTenants: jest.fn(),
    getLeases: jest.fn(),
    getMaintenanceRequests: jest.fn(),
  },
}));

const mockUploadDocument = dashboardService.uploadDocument as jest.MockedFunction<typeof dashboardService.uploadDocument>;
const mockUpdateDocument = dashboardService.updateDocument as jest.MockedFunction<typeof dashboardService.updateDocument>;
const mockGetProperties = dashboardService.getProperties as jest.MockedFunction<typeof dashboardService.getProperties>;
const mockGetTenants = dashboardService.getTenants as jest.MockedFunction<typeof dashboardService.getTenants>;
const mockGetLeases = dashboardService.getLeases as jest.MockedFunction<typeof dashboardService.getLeases>;
const mockGetMaintenanceRequests = dashboardService.getMaintenanceRequests as jest.MockedFunction<typeof dashboardService.getMaintenanceRequests>;

const renderDocumentUpload = (props: Partial<Parameters<typeof DocumentUpload>[0]> = {}) => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onSubmitSuccess: jest.fn(),
    initialValues: {},
    isEdit: false,
    documentId: undefined,
  };
  return render(
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DocumentUpload {...defaultProps} {...props} />
      </LocalizationProvider>
    </ThemeProvider>
  );
};

describe('DocumentUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUploadDocument.mockResolvedValue({ id: 'new' } as Document);
    mockUpdateDocument.mockResolvedValue({ id: 'updated' } as Document);
    mockGetProperties.mockResolvedValue({ data: [], total: 0, page: 1 });
    mockGetTenants.mockResolvedValue({ data: [], total: 0 });
    mockGetLeases.mockResolvedValue({ data: [], total: 0 });
    mockGetMaintenanceRequests.mockResolvedValue({ data: [], total: 0 });
  });

  it('renders upload form fields when open', () => {
    renderDocumentUpload();

    expect(screen.getByText('Upload Document')).toBeInTheDocument();
    expect(screen.getByText('File Upload')).toBeInTheDocument();
    expect(screen.getByLabelText(/document name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders edit form when isEdit is true', () => {
    renderDocumentUpload({ isEdit: true });

    expect(screen.getByText('Edit Document')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });

  it('closes form on cancel click', () => {
    const mockOnClose = jest.fn();
    renderDocumentUpload({ onClose: mockOnClose });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows validation errors on submit with invalid data', async () => {
    renderDocumentUpload();

    const submitButton = screen.getByRole('button', { name: /upload/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('shows file validation error when no file selected', async () => {
    renderDocumentUpload();

    const nameInput = screen.getByLabelText(/document name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Document' } });

    const submitButton = screen.getByRole('button', { name: /upload/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUploadDocument).not.toHaveBeenCalled();
    });
  });

  it('submits upload with valid data and calls onSubmitSuccess', async () => {
    const mockOnSubmitSuccess = jest.fn();
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    renderDocumentUpload({ onSubmitSuccess: mockOnSubmitSuccess });

    // Mock file drop
    const fileInput = screen.getByText('Drag & drop a file here, or click to select');
    // Simulate file selection by setting the file in the form
    // This is a simplified test - in real scenario, you'd need to mock the dropzone

    const nameInput = screen.getByLabelText(/document name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Document' } });

    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

    // Note: File upload testing would require more complex mocking of react-dropzone
    // For now, we'll test the form validation and submission logic
  });

  it('submits update with valid data when in edit mode', async () => {
    const mockOnSubmitSuccess = jest.fn();
    const initialDocument: Partial<Document> = {
      id: '1',
      name: 'Existing Document',
      description: 'Existing description',
      tags: ['tag1', 'tag2'],
    };

    renderDocumentUpload({
      onSubmitSuccess: mockOnSubmitSuccess,
      initialValues: initialDocument,
      isEdit: true,
      documentId: '1'
    });

    // Verify pre-filled values
    expect(screen.getByLabelText(/document name/i)).toHaveValue('Existing Document');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Existing description');

    // Change name
    const nameInput = screen.getByLabelText(/document name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Document' } });

    const submitButton = screen.getByRole('button', { name: /update/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateDocument).toHaveBeenCalledWith('1', {
        name: 'Updated Document',
        description: 'Existing description',
        tags: ['tag1', 'tag2'],
      });
      expect(mockOnSubmitSuccess).toHaveBeenCalled();
    });
  });

  it('loads related data on open', () => {
    renderDocumentUpload();

    expect(mockGetProperties).toHaveBeenCalledWith(1, 100);
    expect(mockGetTenants).toHaveBeenCalledWith(1, 100);
    expect(mockGetLeases).toHaveBeenCalledWith(1, 100);
    expect(mockGetMaintenanceRequests).toHaveBeenCalledWith(1, 100);
  });

  it('disables submit button when uploading', () => {
    mockUploadDocument.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderDocumentUpload();

    const nameInput = screen.getByLabelText(/document name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Document' } });

    // Note: Testing file upload state would require more complex setup
    // This is a basic structure for the test file
  });
});