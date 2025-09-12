import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Chip,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Tag as TagIcon,
} from '@mui/icons-material';
import { dashboardService, Document } from '../services/dashboardService';

interface DocumentTagsProps {
  documents: Document[];
  onTagsUpdate?: (documentId: string, tags: string[]) => void;
  readOnly?: boolean;
}

interface TagStats {
  tag: string;
  count: number;
  color?: string;
}

const DocumentTags: React.FC<DocumentTagsProps> = ({
  documents,
  onTagsUpdate,
  readOnly = false,
}) => {
  const [newTag, setNewTag] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [bulkTagDialogOpen, setBulkTagDialogOpen] = useState(false);
  const [manageTagsDialogOpen, setManageTagsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editTagValue, setEditTagValue] = useState('');

  const queryClient = useQueryClient();

  // Get all unique tags from documents
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    documents.forEach(doc => {
      doc.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [documents]);

  // Calculate tag statistics
  const tagStats: TagStats[] = React.useMemo(() => {
    const stats: { [key: string]: number } = {};
    documents.forEach(doc => {
      doc.tags.forEach(tag => {
        stats[tag] = (stats[tag] || 0) + 1;
      });
    });

    return Object.entries(stats)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [documents]);

  const addTagMutation = useMutation({
    mutationFn: ({ documentId, tags }: { documentId: string; tags: string[] }) =>
      dashboardService.addTags(documentId, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      onTagsUpdate?.(addTagMutation.variables?.documentId || '', addTagMutation.variables?.tags || []);
    },
  });

  const bulkTagMutation = useMutation({
    mutationFn: ({ documentIds, tags }: { documentIds: string[]; tags: string[] }) =>
      dashboardService.bulkTagDocuments(documentIds, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setBulkTagDialogOpen(false);
      setSelectedTags([]);
    },
  });

  const handleAddTag = async (documentId: string, tag: string) => {
    if (tag.trim()) {
      await addTagMutation.mutateAsync({ documentId, tags: [tag.trim()] });
    }
  };

  const handleRemoveTag = async (documentId: string, tagToRemove: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (document) {
      const newTags = document.tags.filter(tag => tag !== tagToRemove);
      await addTagMutation.mutateAsync({ documentId, tags: newTags });
    }
  };

  const handleBulkTag = async () => {
    if (selectedTags.length > 0 && documents.length > 0) {
      const documentIds = documents.map(doc => doc.id);
      await bulkTagMutation.mutateAsync({ documentIds, tags: selectedTags });
    }
  };

  const handleQuickTag = async (tag: string) => {
    if (documents.length > 0) {
      const documentIds = documents.map(doc => doc.id);
      await bulkTagMutation.mutateAsync({ documentIds, tags: [tag] });
    }
  };

  const getTagColor = (tag: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    const colors: Array<"default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> =
      ['primary', 'secondary', 'success', 'warning', 'error', 'info'];
    const index = tag.length % colors.length;
    return colors[index];
  };

  if (readOnly && documents.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No documents selected
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Document Tags</Typography>
        {!readOnly && documents.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TagIcon />}
              onClick={() => setBulkTagDialogOpen(true)}
            >
              Bulk Tag
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setManageTagsDialogOpen(true)}
            >
              Manage Tags
            </Button>
          </Box>
        )}
      </Box>

      {/* Tag Statistics */}
      {tagStats.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Tag Statistics
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {tagStats.slice(0, 10).map((stat) => (
              <Chip
                key={stat.tag}
                label={`${stat.tag} (${stat.count})`}
                size="small"
                color={getTagColor(stat.tag)}
                variant="outlined"
                onClick={() => !readOnly && handleQuickTag(stat.tag)}
                sx={{ cursor: readOnly ? 'default' : 'pointer' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Document Tags */}
      {documents.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Document Tags ({documents.length} selected)
          </Typography>
          {documents.map((document) => (
            <Box key={document.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                {document.name}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                {document.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    color={getTagColor(tag)}
                    onDelete={!readOnly ? () => handleRemoveTag(document.id, tag) : undefined}
                    deleteIcon={<DeleteIcon />}
                  />
                ))}
                {!readOnly && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTag(document.id, newTag);
                          setNewTag('');
                        }
                      }}
                      sx={{ width: 120 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => {
                        handleAddTag(document.id, newTag);
                        setNewTag('');
                      }}
                      disabled={!newTag.trim()}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Bulk Tag Dialog */}
      <Dialog open={bulkTagDialogOpen} onClose={() => setBulkTagDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Tag Documents</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add tags to {documents.length} selected documents
          </Typography>
          <Autocomplete
            multiple
            options={allTags}
            value={selectedTags}
            onChange={(_, newValue) => setSelectedTags(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Select tags" placeholder="Choose tags..." />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  size="small"
                  color={getTagColor(option)}
                />
              ))
            }
            freeSolo
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Or add new tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newTag.trim()) {
                setSelectedTags(prev => [...prev, newTag.trim()]);
                setNewTag('');
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkTagDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBulkTag}
            variant="contained"
            disabled={selectedTags.length === 0 || bulkTagMutation.isPending}
          >
            {bulkTagMutation.isPending ? <CircularProgress size={20} /> : 'Apply Tags'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Tags Dialog */}
      <Dialog open={manageTagsDialogOpen} onClose={() => setManageTagsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Manage Tags</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            View and manage all available tags
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {allTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                color={getTagColor(tag)}
                onDelete={() => {
                  // In a real implementation, you might want to remove the tag from all documents
                  console.log('Remove tag:', tag);
                }}
                deleteIcon={<DeleteIcon />}
              />
            ))}
          </Box>
          {allTags.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No tags found
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageTagsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DocumentTags;