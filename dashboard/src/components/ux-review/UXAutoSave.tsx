import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Snackbar, Alert, Typography, Box, CircularProgress } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

interface UXAutoSaveProps {
  data: any;
  onSave: (data: any) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
  showNotifications?: boolean;
  saveKey?: string;
  onStatusChange?: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
}

export const UXAutoSave: React.FC<UXAutoSaveProps> = ({
  data,
  onSave,
  debounceMs = 1000,
  enabled = true,
  showNotifications = true,
  saveKey = 'ux-autosave',
  onStatusChange,
}) => {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const dataRef = useRef(data);
  const isInitialLoad = useRef(true);

  // Load from localStorage on mount
  const loadFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(saveKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data && parsed.timestamp) {
          const age = Date.now() - parsed.timestamp;
          if (age < 24 * 60 * 60 * 1000) { // Less than 24 hours
            return parsed.data;
          }
        }
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
    return null;
  }, [saveKey]);

  // Save to localStorage
  const saveToStorage = useCallback((data: any) => {
    try {
      const toSave = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(saveKey, JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [saveKey]);

  // Clear saved data
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(saveKey);
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
  }, [saveKey]);

  // Perform save
  const performSave = useCallback(async () => {
    if (!enabled || status === 'saving') return;

    setStatus('saving');
    onStatusChange?.('saving');
    setError(null);

    try {
      await onSave(dataRef.current);
      setStatus('saved');
      onStatusChange?.('saved');
      setLastSaved(new Date());
      saveToStorage(dataRef.current);
    } catch (err) {
      setStatus('error');
      onStatusChange?.('error');
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }, [onSave, enabled, status, onStatusChange, saveToStorage]);

  // Handle data changes
  useEffect(() => {
    if (!enabled) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Update data ref
    dataRef.current = data;

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [data, enabled, debounceMs, performSave]);

  // Restore from storage on mount
  useEffect(() => {
    if (isInitialLoad.current) {
      const saved = loadFromStorage();
      if (saved && onSave) {
        // Restore data silently
        onSave(saved).catch(console.error);
      }
    }
  }, [loadFromStorage, onSave]);

  // Manual save trigger
  const manualSave = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    await performSave();
  }, [performSave]);

  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return <CircularProgress size={16} />;
      case 'saved':
        return <SaveIcon fontSize="small" />;
      case 'error':
        return '⚠️';
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'saving': return 'text.secondary';
      case 'saved': return 'success.main';
      case 'error': return 'error.main';
      default: return 'text.secondary';
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <>
      {showNotifications && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'background.paper',
            p: 1,
            borderRadius: 1,
            boxShadow: 1,
            zIndex: 1000,
          }}
        >
          {getStatusIcon()}
          <Typography variant="caption" color={getStatusColor()}>
            {status === 'saving' && 'Saving...'}
            {status === 'saved' && `Saved ${formatLastSaved()}`}
            {status === 'error' && 'Save failed'}
            {status === 'idle' && 'Auto-save enabled'}
          </Typography>
        </Box>
      )}

      <Snackbar
        open={!!error && showNotifications}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          Auto-save failed: {error}
        </Alert>
      </Snackbar>
    </>
  );
};

// Hook for using auto-save
export const useAutoSave = (initialData: any, saveFunction: (data: any) => Promise<void>, options?: Partial<UXAutoSaveProps>) => {
  const [data, setData] = useState(initialData);
  
  return {
    data,
    setData,
    autoSaveComponent: (
      <UXAutoSave
        data={data}
        onSave={saveFunction}
        {...options}
      />
    ),
  };
};