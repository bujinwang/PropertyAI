import React, { useEffect, useCallback } from 'react';
import { Snackbar, Alert, Typography, Box } from '@mui/material';
import { Keyboard as KeyboardIcon } from '@mui/icons-material';

interface UXKeyboardShortcutsProps {
  onNewReview?: () => void;
  onFocusFilters?: () => void;
  onExport?: () => void;
  onSearch?: () => void;
  onToggleBulk?: () => void;
  onEscape?: () => void;
  isModalOpen?: boolean;
}

export const UXKeyboardShortcuts: React.FC<UXKeyboardShortcutsProps> = ({
  onNewReview,
  onFocusFilters,
  onExport,
  onSearch,
  onToggleBulk,
  onEscape,
  isModalOpen = false,
}) => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const shortcuts = [
    { key: 'Ctrl+N', description: 'New UX Review', action: onNewReview },
    { key: 'Ctrl+F', description: 'Focus Filters', action: onFocusFilters },
    { key: 'Ctrl+E', description: 'Export Reviews', action: onExport },
    { key: 'Ctrl+K', description: 'Quick Search', action: onSearch },
    { key: 'Ctrl+B', description: 'Toggle Bulk Mode', action: onToggleBulk },
    { key: 'Escape', description: 'Close/Cancel', action: onEscape },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs or modals
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';
    
    if (isInput || isModalOpen) {
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
      }
      return;
    }

    const { ctrlKey, metaKey, key } = event;
    const isCmd = ctrlKey || metaKey;

    switch (true) {
      case isCmd && key === 'n':
        event.preventDefault();
        onNewReview?.();
        setSnackbar({ open: true, message: 'Creating new UX review...' });
        break;
      case isCmd && key === 'f':
        event.preventDefault();
        onFocusFilters?.();
        setSnackbar({ open: true, message: 'Filters focused' });
        break;
      case isCmd && key === 'e':
        event.preventDefault();
        onExport?.();
        setSnackbar({ open: true, message: 'Opening export...' });
        break;
      case isCmd && key === 'k':
        event.preventDefault();
        onSearch?.();
        setSnackbar({ open: true, message: 'Quick search activated' });
        break;
      case isCmd && key === 'b':
        event.preventDefault();
        onToggleBulk?.();
        setSnackbar({ open: true, message: 'Bulk mode toggled' });
        break;
      case key === 'Escape':
        event.preventDefault();
        onEscape?.();
        break;
      case isCmd && key === '/':
        event.preventDefault();
        setShowShortcuts(prev => !prev);
        break;
    }
  }, [onNewReview, onFocusFilters, onExport, onSearch, onToggleBulk, onEscape, isModalOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const ShortcutsModal = () => (
    <Box
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        p: 3,
        borderRadius: 1,
        boxShadow: 24,
        minWidth: 300,
        zIndex: 1000,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Keyboard Shortcuts
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {shortcuts.map(({ key, description }) => (
          <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">{description}</Typography>
            <Typography variant="body2" fontWeight="bold">{key}</Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Press Ctrl+/ to toggle this help
      </Typography>
    </Box>
  );

  return (
    <>
      {showShortcuts && <ShortcutsModal />}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity="info"
          icon={<KeyboardIcon fontSize="small" />}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};