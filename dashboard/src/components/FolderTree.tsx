import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  CreateNewFolder as CreateNewFolderIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { dashboardService, Folder } from '../services/dashboardService';

interface FolderTreeProps {
  selectedFolderId?: string;
  onFolderSelect?: (folderId: string | null) => void;
  onFolderCreate?: (folder: Folder) => void;
  onFolderUpdate?: (folder: Folder) => void;
  onFolderDelete?: (folderId: string) => void;
}

interface FolderNode extends Folder {
  children?: FolderNode[];
}

const FolderTree: React.FC<FolderTreeProps> = ({
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
  onFolderUpdate,
  onFolderDelete,
}) => {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    folderId: string;
  } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: folders, isLoading, error } = useQuery({
    queryKey: ['folders'],
    queryFn: () => dashboardService.getFolders(),
  });

  // Build folder tree structure
  const buildFolderTree = (folders: Folder[]): FolderNode[] => {
    const folderMap = new Map<string, FolderNode>();
    const rootFolders: FolderNode[] = [];

    // Create folder nodes
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Build tree structure
    folders.forEach(folder => {
      const node = folderMap.get(folder.id)!;
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        rootFolders.push(node);
      }
    });

    return rootFolders;
  };

  const folderTree = folders ? buildFolderTree(folders) : [];

  const createFolderMutation = useMutation({
    mutationFn: (data: { name: string; parentId?: string }) =>
      dashboardService.createFolder(data),
    onSuccess: (newFolder) => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setCreateDialogOpen(false);
      setNewFolderName('');
      setParentFolderId(null);
      onFolderCreate?.(newFolder);
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<Folder, 'name' | 'parentId'>> }) =>
      dashboardService.updateFolder(id, data),
    onSuccess: (updatedFolder) => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setEditDialogOpen(false);
      setEditingFolder(null);
      onFolderUpdate?.(updatedFolder);
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => dashboardService.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      onFolderDelete?.(contextMenu?.folderId || '');
      setContextMenu(null);
    },
  });

  useEffect(() => {
    if (selectedFolderId) {
      setSelected(selectedFolderId);
      // Expand path to selected folder
      const expandPath = (folders: Folder[], targetId: string, path: string[] = []): string[] => {
        for (const folder of folders) {
          const currentPath = [...path, folder.id];
          if (folder.id === targetId) {
            return currentPath;
          }
          if (folder.parentId) {
            const childPath = expandPath(folders, targetId, currentPath);
            if (childPath.length > 0) {
              return childPath;
            }
          }
        }
        return [];
      };

      if (folders) {
        const path = expandPath(folders, selectedFolderId);
        setExpanded(prev => Array.from(new Set([...prev, ...path])));
      }
    }
  }, [selectedFolderId, folders]);

  const handleToggle = (folderId: string) => {
    setExpanded(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleSelect = (folderId: string | null) => {
    setSelected(folderId || '');
    onFolderSelect?.(folderId);
  };

  const handleContextMenu = (event: React.MouseEvent, folderId: string) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      folderId,
    });
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate({
        name: newFolderName.trim(),
        parentId: parentFolderId || undefined,
      });
    }
  };

  const handleEditFolder = () => {
    if (editingFolder && newFolderName.trim()) {
      updateFolderMutation.mutate({
        id: editingFolder.id,
        data: { name: newFolderName.trim() },
      });
    }
  };

  const handleDeleteFolder = () => {
    if (contextMenu?.folderId) {
      deleteFolderMutation.mutate(contextMenu.folderId);
    }
  };

  const renderTree = (nodes: FolderNode[], level: number = 0): React.ReactNode => {
    return nodes.map((node) => (
      <Box key={node.id}>
        <ListItemButton
          selected={selected === node.id}
          onClick={() => handleSelect(node.id)}
          onContextMenu={(e: React.MouseEvent) => handleContextMenu(e, node.id)}
          sx={{ pl: level * 3 }}
        >
          <ListItemIcon>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(node.id);
              }}
            >
              {expanded.includes(node.id) ? <ExpandMoreIcon /> : <ChevronRightIcon />}
            </IconButton>
          </ListItemIcon>
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText
            primary={node.name}
            secondary={`${node.documentCount || 0} documents`}
          />
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, node.id);
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </ListItemButton>
        {node.children && node.children.length > 0 && (
          <Collapse in={expanded.includes(node.id)} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {renderTree(node.children, level + 1)}
            </List>
          </Collapse>
        )}
      </Box>
    ));
  };

  if (isLoading) {
    return (
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2 }}>
        <Alert severity="error">
          Failed to load folders: {(error as Error).message}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Folders</Typography>
        <IconButton
          onClick={() => setCreateDialogOpen(true)}
          title="Create new folder"
        >
          <CreateNewFolderIcon />
        </IconButton>
      </Box>

      <List sx={{ minHeight: 400 }}>
        <ListItemButton
          selected={selected === ''}
          onClick={() => handleSelect(null)}
        >
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText primary="All Documents" />
        </ListItemButton>
        {renderTree(folderTree)}
      </List>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem
          onClick={() => {
            setParentFolderId(contextMenu?.folderId || null);
            setCreateDialogOpen(true);
            setContextMenu(null);
          }}
        >
          <CreateNewFolderIcon sx={{ mr: 1 }} />
          Create Subfolder
        </MenuItem>
        <MenuItem
          onClick={() => {
            const folder = folders?.find(f => f.id === contextMenu?.folderId);
            if (folder) {
              setEditingFolder(folder);
              setNewFolderName(folder.name);
              setEditDialogOpen(true);
            }
            setContextMenu(null);
          }}
        >
          <EditIcon sx={{ mr: 1 }} />
          Rename
        </MenuItem>
        <MenuItem
          onClick={handleDeleteFolder}
          disabled={deleteFolderMutation.isPending}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Folder Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateFolder}
            variant="contained"
            disabled={!newFolderName.trim() || createFolderMutation.isPending}
          >
            {createFolderMutation.isPending ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rename Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleEditFolder()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEditFolder}
            variant="contained"
            disabled={!newFolderName.trim() || updateFolderMutation.isPending}
          >
            {updateFolderMutation.isPending ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default FolderTree;