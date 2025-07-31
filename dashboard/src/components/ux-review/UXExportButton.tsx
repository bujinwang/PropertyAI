import React from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';

interface UXExportButtonProps {
  reviews: any[];
  onExport: (format: string) => void;
}

export const UXExportButton: React.FC<UXExportButtonProps> = ({ reviews, onExport }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [confirmDialog, setConfirmDialog] = React.useState(false);
  const [selectedFormat, setSelectedFormat] = React.useState('');

  const exportFormats = [
    { key: 'csv', label: 'CSV', icon: <TableChartIcon />, description: 'Export as spreadsheet' },
    { key: 'pdf', label: 'PDF', icon: <DescriptionIcon />, description: 'Export as PDF report' },
    { key: 'json', label: 'JSON', icon: <DescriptionIcon />, description: 'Export raw data' },
  ];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format: string) => {
    setSelectedFormat(format);
    setConfirmDialog(true);
    handleClose();
  };

  const confirmExport = () => {
    onExport(selectedFormat);
    setConfirmDialog(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'e':
          event.preventDefault();
          handleClick(event as any);
          break;
        case 'k':
          event.preventDefault();
          // Future: Quick search
          break;
      }
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown as any);
    return () => {
      document.removeEventListener('keydown', handleKeyDown as any);
    };
  }, []);

  return (
    <Box>
      <Button
        variant="outlined"
        onClick={handleClick}
        startIcon={<DownloadIcon />}
        aria-label="Export UX reviews (Ctrl+E)"
        title="Export reviews (Ctrl+E)"
      >
        Export
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        aria-label="Export format options"
      >
        {exportFormats.map((format) => (
          <MenuItem key={format.key} onClick={() => handleExport(format.key)}>
            <ListItemIcon>{format.icon}</ListItemIcon>
            <ListItemText primary={format.label} secondary={format.description} />
          </MenuItem>
        ))}
      </Menu>

      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Export UX Reviews</DialogTitle>
        <DialogContent>
          <Typography>
            Export {reviews.length} reviews as {selectedFormat.toUpperCase()}?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will include all current filters and sorting.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button onClick={confirmExport} variant="contained">Download</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};