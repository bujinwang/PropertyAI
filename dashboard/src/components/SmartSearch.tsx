import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Typography,
  CircularProgress,
  Alert,
  Autocomplete,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import {
  Search,
  Clear,
  Home,
  Person,
  Build,
  Payment,
  TrendingUp,
  Save,
  History,
  FilterList,
  Refresh,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';

interface SearchResult {
  id: string;
  type: 'property' | 'tenant' | 'maintenance' | 'transaction';
  title: string;
  description: string;
  relevanceScore: number;
  metadata: any;
}

interface SearchShortcut {
  id: string;
  title: string;
  query: string;
  description: string;
  icon: string;
}

const SmartSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [shortcuts, setShortcuts] = useState<SearchShortcut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [saveDialog, setSaveDialog] = useState(false);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadShortcuts();
    loadSavedSearches();
    loadSearchHistory();
  }, []);

  const loadShortcuts = async () => {
    try {
      const response = await apiService.get('/smart-search/shortcuts');
      if (response.data && response.data.data) {
        setShortcuts(response.data.data);
      }
    } catch (err: any) {
      console.error('Error loading shortcuts:', err);
    }
  };

  const loadSavedSearches = async () => {
    try {
      const response = await apiService.get('/smart-search/saved-searches');
      if (response.data && response.data.data) {
        setSavedSearches(response.data.data);
      }
    } catch (err: any) {
      console.error('Error loading saved searches:', err);
    }
  };

  const loadSearchHistory = () => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  };

  const saveSearchHistory = (searchQuery: string) => {
    const updatedHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const response = await apiService.post('/smart-search/search', {
        query: searchQuery,
        limit: 20,
      });

      if (response.data && response.data.data) {
        setResults(response.data.data.results);
        saveSearchHistory(searchQuery);
      }
    } catch (err: any) {
      setError('Failed to perform search');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = async (value: string) => {
    setQuery(value);

    if (value.length >= 2) {
      try {
        const response = await apiService.get('/smart-search/suggestions', {
          params: { query: value }
        });

        if (response.data && response.data.data) {
          setSuggestions(response.data.data.suggestions);
          setShowSuggestions(true);
        }
      } catch (err: any) {
        console.error('Error getting suggestions:', err);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleShortcutClick = (shortcut: SearchShortcut) => {
    setQuery(shortcut.query);
    handleSearch(shortcut.query);
  };

  const handleSaveSearch = async () => {
    if (!query.trim()) return;

    try {
      await apiService.post('/smart-search/save-query', {
        name: `Search: ${query.substring(0, 30)}`,
        query: query,
      });
      setSaveDialog(false);
      loadSavedSearches();
    } catch (err: any) {
      console.error('Error saving search:', err);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'property': return <Home />;
      case 'tenant': return <Person />;
      case 'maintenance': return <Build />;
      case 'transaction': return <Payment />;
      default: return <Search />;
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case 'property': return '#4caf50';
      case 'tenant': return '#2196f3';
      case 'maintenance': return '#ff9800';
      case 'transaction': return '#9c27b0';
      default: return '#757575';
    }
  };

  const formatRelevanceScore = (score: number) => {
    if (score >= 8) return 'Very High';
    if (score >= 6) return 'High';
    if (score >= 4) return 'Medium';
    if (score >= 2) return 'Low';
    return 'Very Low';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Smart Search
      </Typography>

      {/* Search Input */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Search properties, tenants, maintenance, transactions..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {query && (
                    <IconButton onClick={() => setQuery('')}>
                      <Clear />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
            inputRef={searchInputRef}
          />
          <Button
            variant="contained"
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <Search />}
          >
            Search
          </Button>
          <Button
            variant="outlined"
            onClick={() => setSaveDialog(true)}
            disabled={!query.trim()}
            startIcon={<Save />}
          >
            Save
          </Button>
        </Box>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
            <List dense>
              {suggestions.map((suggestion, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => {
                    setQuery(suggestion);
                    setShowSuggestions(false);
                    handleSearch(suggestion);
                  }}
                >
                  <ListItemText primary={suggestion} />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Paper>

      {/* Search Shortcuts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Search
            </Typography>
            <Grid container spacing={1}>
              {shortcuts.map((shortcut) => (
                <Grid item xs={6} key={shortcut.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 3 }
                    }}
                    onClick={() => handleShortcutClick(shortcut)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {shortcut.icon}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {shortcut.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {shortcut.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Searches
            </Typography>
            <List dense>
              {searchHistory.slice(0, 5).map((historyItem, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => {
                    setQuery(historyItem);
                    handleSearch(historyItem);
                  }}
                >
                  <ListItemIcon>
                    <History />
                  </ListItemIcon>
                  <ListItemText primary={historyItem} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Search Results ({results.length})
            </Typography>
            <Button
              size="small"
              onClick={() => handleSearch()}
              startIcon={<Refresh />}
            >
              Refresh
            </Button>
          </Box>

          <List>
            {results.map((result, index) => (
              <React.Fragment key={result.id}>
                <ListItem
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: getResultColor(result.type) }}>
                      {getResultIcon(result.type)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {result.title}
                        </Typography>
                        <Chip
                          label={result.type}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={formatRelevanceScore(result.relevanceScore)}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          {result.description}
                        </Typography>
                        {result.metadata && (
                          <Box sx={{ mt: 1 }}>
                            {result.type === 'property' && result.metadata.unitCount && (
                              <Typography variant="caption" color="textSecondary">
                                Units: {result.metadata.unitCount} • Occupancy: {(result.metadata.occupancyRate * 100).toFixed(1)}%
                              </Typography>
                            )}
                            {result.type === 'tenant' && result.metadata.property && (
                              <Typography variant="caption" color="textSecondary">
                                Property: {result.metadata.property} • Unit: {result.metadata.unitNumber}
                              </Typography>
                            )}
                            {result.type === 'maintenance' && result.metadata.category && (
                              <Typography variant="caption" color="textSecondary">
                                Category: {result.metadata.category} • Priority: {result.metadata.priority} • Status: {result.metadata.status}
                              </Typography>
                            )}
                            {result.type === 'transaction' && result.metadata.amount && (
                              <Typography variant="caption" color="textSecondary">
                                Amount: ${result.metadata.amount} • Type: {result.metadata.type} • Category: {result.metadata.category}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      <Chip
                        label={`${result.relevanceScore.toFixed(1)}`}
                        size="small"
                        color="secondary"
                      />
                      <Typography variant="caption" color="textSecondary">
                        Score
                      </Typography>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < results.length - 1 && <Divider sx={{ my: 1 }} />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Save Search Dialog */}
      <Dialog
        open={saveDialog}
        onClose={() => setSaveDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Save Search Query</DialogTitle>
        <DialogContent>
          <Typography>
            Save this search query for quick access later?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Query: "{query}"
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSearch} variant="contained">
            Save Search
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmartSearch;