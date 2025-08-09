import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PhotoCamera,
  Upload,
  RequestQuote,
  Visibility,
  Download,
  Share,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';

interface AnalysisResult {
  issuesDetected: string[];
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendations: string;
  estimatedCost?: number;
  urgency?: string;
  description?: string;
}

interface Quote {
  id: string;
  vendor: string;
  amount: number;
  description: string;
  timeline: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const MaintenanceRequests: React.FC = () => {
  // Photo Analysis State
  const [imageUrl, setImageUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Quotes State
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleAnalyzePhoto = async () => {
    if (!imageUrl && !selectedFile) {
      setAnalysisError('Please provide an image URL or upload a file.');
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      let urlToAnalyze = imageUrl;
      
      // If file is selected, we would typically upload it first
      if (selectedFile) {
        // For demo purposes, we'll use a placeholder URL
        // In a real implementation, you'd upload the file to your server/S3 first
        urlToAnalyze = URL.createObjectURL(selectedFile);
      }

      const result = await apiService.analyzePhoto('temp-maintenance-request', urlToAnalyze);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Mock analysis result for demo
      const mockResult: AnalysisResult = {
        issuesDetected: ['Water damage', 'Mold growth', 'Paint peeling'],
        severity: 'High',
        recommendations: 'Immediate attention required. Contact a professional water damage restoration service. Address moisture source and replace affected materials.',
        estimatedCost: 2500,
        urgency: 'Within 24 hours',
        description: 'Significant water damage detected in bathroom area with potential mold growth.'
      };

      setAnalysisResult(mockResult);
      
      // Auto-generate quotes based on analysis
      generateQuotes(mockResult);
      
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to analyze photo.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const generateQuotes = async (analysis: AnalysisResult) => {
    setQuotesLoading(true);
    
    // Mock quotes generation based on analysis
    const mockQuotes: Quote[] = [
      {
        id: '1',
        vendor: 'AquaFix Water Restoration',
        amount: 2800,
        description: 'Complete water damage restoration including mold remediation and material replacement',
        timeline: '2-3 days',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        vendor: 'ProClean Restoration Services',
        amount: 2200,
        description: 'Water damage cleanup and mold treatment with 1-year warranty',
        timeline: '1-2 days',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        vendor: 'Emergency Dry Solutions',
        amount: 3100,
        description: 'Premium water damage restoration with antimicrobial treatment',
        timeline: '3-4 days',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ];

    // Simulate API delay
    setTimeout(() => {
      setQuotes(mockQuotes);
      setQuotesLoading(false);
    }, 1500);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImageUrl(''); // Clear URL if file is selected
    }
  };

  const handleQuoteAction = (quoteId: string, action: 'approve' | 'reject') => {
    setQuotes(prev => prev.map(quote => 
      quote.id === quoteId 
        ? { ...quote, status: action === 'approve' ? 'approved' : 'rejected' }
        : quote
    ));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low': return 'success';
      case 'Medium': return 'warning';
      case 'High': return 'error';
      case 'Critical': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Maintenance Requests
      </Typography>

      <Grid container spacing={4}>
        {/* Photo Analysis Section */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhotoCamera color="primary" />
                Photo Analysis
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Enter image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  disabled={!!selectedFile}
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Or upload an image file:
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<Upload />}
                  >
                    Upload Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </Button>
                  {selectedFile && (
                    <Typography variant="body2" color="textSecondary">
                      {selectedFile.name}
                    </Typography>
                  )}
                </Box>

                <Button
                  variant="contained"
                  onClick={handleAnalyzePhoto}
                  disabled={analysisLoading || (!imageUrl && !selectedFile)}
                  startIcon={analysisLoading ? <CircularProgress size={20} /> : <PhotoCamera />}
                  fullWidth
                  size="large"
                >
                  {analysisLoading ? 'Analyzing...' : 'Analyze Photo'}
                </Button>
              </Box>

              {analysisError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {analysisError}
                </Alert>
              )}

              {analysisResult && (
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>
                    Analysis Results
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Issues Detected:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {analysisResult.issuesDetected.map((issue, index) => (
                        <Chip key={index} label={issue} size="small" color="warning" />
                      ))}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Severity:
                    </Typography>
                    <Chip 
                      label={analysisResult.severity} 
                      color={getSeverityColor(analysisResult.severity) as any}
                      size="small"
                    />
                  </Box>

                  {analysisResult.estimatedCost && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Estimated Cost:
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ${analysisResult.estimatedCost.toLocaleString()}
                      </Typography>
                    </Box>
                  )}

                  {analysisResult.urgency && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Recommended Timeline:
                      </Typography>
                      <Typography variant="body2" color="error">
                        {analysisResult.urgency}
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Recommendations:
                    </Typography>
                    <Typography variant="body2">
                      {analysisResult.recommendations}
                    </Typography>
                  </Box>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quotes Section */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RequestQuote color="primary" />
                Quotes
              </Typography>

              {quotesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Generating quotes based on analysis...
                  </Typography>
                </Box>
              ) : quotes.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    Analyze a photo first to generate maintenance quotes
                  </Typography>
                </Box>
              ) : (
                <List>
                  {quotes.map((quote, index) => (
                    <React.Fragment key={quote.id}>
                      <ListItem
                        sx={{
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          p: 2,
                          border: 1,
                          borderColor: 'grey.200',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" color="primary">
                            {quote.vendor}
                          </Typography>
                          <Chip 
                            label={quote.status.toUpperCase()} 
                            size="small"
                            color={quote.status === 'approved' ? 'success' : quote.status === 'rejected' ? 'error' : 'default'}
                          />
                        </Box>
                        
                        <Typography variant="h5" color="success.main" sx={{ mb: 1 }}>
                          ${quote.amount.toLocaleString()}
                        </Typography>
                        
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          {quote.description}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          <strong>Timeline:</strong> {quote.timeline}
                        </Typography>

                        {quote.status === 'pending' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleQuoteAction(quote.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleQuoteAction(quote.id, 'reject')}
                            >
                              Reject
                            </Button>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedQuote(quote);
                                setQuoteDialogOpen(true);
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Box>
                        )}
                      </ListItem>
                      {index < quotes.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quote Details Dialog */}
      <Dialog open={quoteDialogOpen} onClose={() => setQuoteDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Quote Details</DialogTitle>
        <DialogContent>
          {selectedQuote && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedQuote.vendor}
              </Typography>
              <Typography variant="h4" color="success.main" gutterBottom>
                ${selectedQuote.amount.toLocaleString()}
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedQuote.description}
              </Typography>
              <Typography variant="body2">
                <strong>Timeline:</strong> {selectedQuote.timeline}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {selectedQuote.status.toUpperCase()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuoteDialogOpen(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Download />}>
            Download PDF
          </Button>
          <Button variant="outlined" startIcon={<Share />}>
            Share Quote
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaintenanceRequests;