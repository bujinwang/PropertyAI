import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Skeleton,
  InputAdornment,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Folder as FolderIcon,
  Description as DocumentIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Tag as TagIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { queryKeys } from '../config/queryClient';
import { dashboardService, Document, Folder, DocumentFilters } from '../services/dashboardService';

const DocumentSearch: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedDocumentForShare, setSelectedDocumentForShare] = useState<Document | null>(null);

  // Mock data for folders and users - in real app, these would come from API
  const mockFolders: Folder[] = [
    { id: '1', name: 'Lease Agreements', createdBy: 'user1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { id: '2', name: 'Maintenance Records', createdBy: 'user1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { id: '3', name: 'Financial Documents', createdBy: 'user1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  ];

  const mockUsers = [
    { id: 'user1', name: 'John Smith' },
    { id: 'user2', name: 'Sarah Johnson' },
    { id: 'user3', name: 'Mike Davis' },
  ];

  const { data: searchResults, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', { search: searchQuery, ...filters, page, rowsPerPage }],
    queryFn: () => {
      if (searchQuery.trim()) {
        return dashboardService.searchDocuments(searchQuery, filters);
      }
      return dashboardService.getDocuments(page + 1, rowsPerPage, filters);
    },
    enabled: searchQuery.trim().length > 0 || Object.keys(filters).length > 0,
  });

  const { data: folders } = useQuery({
    queryKey: ['folders'],
    queryFn: () => dashboardService.getFolders(),
  });

  const documents = searchResults?.data || [];
  const totalCount = searchResults?.total || 0;

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: keyof DocumentFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleSearch = () => {
    refetch();
  };

  const handleSelectDocument = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documents.map((doc) => doc.id));
    }
  };

  const handleBulkMove = async (folderId: string | unknown) => {
    try {
      await dashboardService.bulkMoveDocuments(selectedDocuments, folderId as string);
      setSelectedDocuments([]);
      refetch();
    } catch (error) {
      console.error('Failed to move documents:', error);
    }
  };

  const handleBulkTag = async (tags: string[]) => {
    try {
      await dashboardService.bulkTagDocuments(selectedDocuments, tags);
      setSelectedDocuments([]);
      refetch();
    } catch (error) {
      console.error('Failed to tag documents:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedDocuments.length} documents?`)) {
      try {
        await dashboardService.bulkDeleteDocuments(selectedDocuments);
        setSelectedDocuments([]);
        refetch();
      } catch (error) {
        console.error('Failed to delete documents:', error);
      }
    }
  };

  const handleShare = (document: Document) => {
    setSelectedDocumentForShare(document);
    setShareDialogOpen(true);
  };

  const handleShareSubmit = async (userIds: string[]) => {
    if (selectedDocumentForShare) {
      try {
        await dashboardService.shareDocument(selectedDocumentForShare.id, userIds);
        setShareDialogOpen(false);
        setSelectedDocumentForShare(null);
        refetch();
      } catch (error) {
        console.error('Failed to share document:', error);
      }
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    // Simple file type detection
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
    return '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="text" width="60%" height={24} />
        </Box>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Skeleton variant="rectangular" height={56} />
        </Paper>
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {['Name', 'Type', 'Size', 'Tags', 'Uploaded', 'Actions'].map((header) => (
                    <TableCell key={header}>
                      <Skeleton variant="text" width="100%" />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" width="80%" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          <AlertTitle>Failed to search documents</AlertTitle>
          {(error as Error).message}
        </Alert>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              Document Search
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Search and manage documents across all properties
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Refresh results">
              <IconButton onClick={() => refetch()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              label="Search documents"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={!searchQuery.trim() && Object.keys(filters).length === 0}
              >
                Search
              </Button>
            </Box>
          </Box>

          {showFilters && (
            <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              <FormControl fullWidth size="small" sx={{ flex: 1 }}>
                <InputLabel>Folder</InputLabel>
                <Select
                  value={filters.folderId || ''}
                  onChange={(e) => handleFilterChange('folderId', e.target.value || undefined)}
                  label="Folder"
                >
                  <MenuItem value="">
                    <em>All Folders</em>
                  </MenuItem>
                  {(folders || mockFolders).map((folder) => (
                    <MenuItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" sx={{ flex: 1 }}>
                <InputLabel>File Type</InputLabel>
                <Select
                  value={filters.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                  label="File Type"
                >
                  <MenuItem value="">
                    <em>All Types</em>
                  </MenuItem>
                  <MenuItem value="application/pdf">PDF</MenuItem>
                  <MenuItem value="image/jpeg">JPEG</MenuItem>
                  <MenuItem value="image/png">PNG</MenuItem>
                  <MenuItem value="application/msword">Word</MenuItem>
                  <MenuItem value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                    Word (DOCX)
                  </MenuItem>
                </Select>
              </FormControl>
              <DatePicker
                label="From Date"
                value={filters.dateFrom ? new Date(filters.dateFrom) : null}
                onChange={(date) => handleFilterChange('dateFrom', date?.toISOString().split('T')[0])}
                slotProps={{ textField: { size: 'small', fullWidth: true, sx: { flex: 1 } } }}
              />
              <DatePicker
                label="To Date"
                value={filters.dateTo ? new Date(filters.dateTo) : null}
                onChange={(date) => handleFilterChange('dateTo', date?.toISOString().split('T')[0])}
                slotProps={{ textField: { size: 'small', fullWidth: true, sx: { flex: 1 } } }}
              />
            </Box>
          )}
        </Paper>

        {/* Bulk Actions */}
        {selectedDocuments.length > 0 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Bulk Actions ({selectedDocuments.length} selected)
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Move to Folder</InputLabel>
                <Select
                  onChange={(e) => handleBulkMove(e.target.value)}
                  label="Move to Folder"
                >
                  {(folders || mockFolders).map((folder) => (
                    <MenuItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<TagIcon />}
                onClick={() => handleBulkTag(['bulk-tagged'])}
              >
                Add Tag
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDelete}
              >
                Delete Selected
              </Button>
            </Box>
          </Paper>
        )}

        {/* Results Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedDocuments.length === documents.length && documents.length > 0}
                      indeterminate={selectedDocuments.length > 0 && selectedDocuments.length < documents.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell>Folder</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <DocumentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No documents found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Try adjusting your search criteria
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((document: Document) => (
                    <TableRow key={document.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedDocuments.includes(document.id)}
                          onChange={() => handleSelectDocument(document.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{getFileTypeIcon(document.fileType)}</span>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {document.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              v{document.version}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{document.fileType}</TableCell>
                      <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {document.tags.map((tag) => (
                            <Chip key={tag} label={tag} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {document.folderName ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FolderIcon fontSize="small" />
                            <Typography variant="body2">{document.folderName}</Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">Root</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(document.uploadedAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          by {document.uploadedByName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Download">
                          <IconButton size="small">
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Share">
                          <IconButton size="small" onClick={() => handleShare(document)}>
                            <ShareIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Paper>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Share Document</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Share "{selectedDocumentForShare?.name}" with other users
            </Typography>
            <Autocomplete
              multiple
              options={mockUsers}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField {...params} label="Select users" placeholder="Search users..." />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.name}
                    {...getTagProps({ index })}
                    size="small"
                  />
                ))
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => handleShareSubmit([])}
              variant="contained"
            >
              Share
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default DocumentSearch;