import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  LocationOn,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  FilterList,
  Business,
  AttachMoney,
  People,
  Close,
} from '@mui/icons-material';
import { CompetitorData } from '../../types/market-intelligence';
import ConfidenceIndicator from '../../design-system/components/ai/ConfidenceIndicator';

interface CompetitorAnalysisMapProps {
  competitors: CompetitorData[];
  onCompetitorSelect?: (competitor: CompetitorData) => void;
  loading?: boolean;
}

interface MapMarker {
  id: string;
  position: [number, number];
  competitor: CompetitorData;
  color: string;
}

const CompetitorAnalysisMap: React.FC<CompetitorAnalysisMapProps> = ({
  competitors,
  onCompetitorSelect,
  loading = false,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorData | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [mapFilter, setMapFilter] = useState<string>('all');
  const [zoom, setZoom] = useState(12);
  const [center, setCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC

  // Calculate map center based on competitor locations
  useEffect(() => {
    if (competitors && competitors.length > 0) {
      const avgLat = competitors.reduce((sum, comp) => sum + comp.location[0], 0) / competitors.length;
      const avgLng = competitors.reduce((sum, comp) => sum + comp.location[1], 0) / competitors.length;
      setCenter([avgLat, avgLng]);
    }
  }, [competitors]);

  const getMarkerColor = (competitor: CompetitorData): string => {
    const occupancy = competitor.occupancyRate;
    if (occupancy >= 95) return '#4caf50'; // Green - High occupancy
    if (occupancy >= 85) return '#ff9800'; // Orange - Medium occupancy
    return '#f44336'; // Red - Low occupancy
  };

  const getMarkerSize = (competitor: CompetitorData): number => {
    const marketShare = competitor.marketShare;
    if (marketShare >= 15) return 24; // Large
    if (marketShare >= 8) return 20;  // Medium
    return 16; // Small
  };

  const filteredCompetitors = useMemo(() => {
    if (!competitors || !Array.isArray(competitors)) {
      return [];
    }
    
    return competitors.filter(competitor => {
      if (!competitor) return false; // Skip null/undefined competitors
      
      if (mapFilter === 'all') return true;
      if (mapFilter === 'high-occupancy') return (competitor.occupancyRate || 0) >= 90;
      if (mapFilter === 'low-occupancy') return (competitor.occupancyRate || 0) < 80;
      if (mapFilter === 'premium') return (competitor.rentRange?.[1] || 0) > 3000;
      if (mapFilter === 'budget') return (competitor.rentRange?.[1] || 0) <= 2000;
      return true;
    });
  }, [competitors, mapFilter]);

  const handleMarkerClick = (competitor: CompetitorData) => {
    setSelectedCompetitor(competitor);
    setDetailDialogOpen(true);
    if (onCompetitorSelect) {
      onCompetitorSelect(competitor);
    }
  };

  const handleFilterChange = (event: SelectChangeEvent) => {
    setMapFilter(event.target.value);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 1, 8));
  };

  const handleRecenter = () => {
    if (competitors && Array.isArray(competitors) && competitors.length > 0) {
      const validCompetitors = competitors.filter(comp => comp && comp.location && Array.isArray(comp.location));
      if (validCompetitors.length > 0) {
        const avgLat = validCompetitors.reduce((sum, comp) => sum + (comp.location[0] || 0), 0) / validCompetitors.length;
        const avgLng = validCompetitors.reduce((sum, comp) => sum + (comp.location[1] || 0), 0) / validCompetitors.length;
        setCenter([avgLat, avgLng]);
      }
    }
  };

  const formatRentRange = (range: [number, number] | undefined) => {
    if (!range || !Array.isArray(range) || range.length < 2) {
      return 'Range not available';
    }
    return `$${(range[0] || 0).toLocaleString()} - $${(range[1] || 0).toLocaleString()}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Competitor Analysis Map" />
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" height={400}>
            <Typography color="textSecondary">Loading competitor map...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Add check for empty competitors data
  if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
    return (
      <Card elevation={2}>
        <CardHeader
          title="Competitor Analysis Map"
          subheader="No competitor data available"
        />
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" height={400}>
            <Typography color="textSecondary">
              No competitor data available at this time.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2}>
      <CardHeader
        title="Competitor Analysis Map"
        subheader={`${filteredCompetitors.length} of ${competitors?.length || 0} competitors shown`}
        action={
          <Box display="flex" gap={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Filter</InputLabel>
              <Select
                value={mapFilter}
                label="Filter"
                onChange={handleFilterChange}
              >
                <MenuItem value="all">All Properties</MenuItem>
                <MenuItem value="high-occupancy">High Occupancy (90%+)</MenuItem>
                <MenuItem value="low-occupancy">Low Occupancy (&lt;80%)</MenuItem>
                <MenuItem value="premium">Premium ($3000+)</MenuItem>
                <MenuItem value="budget">Budget (≤$2000)</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Zoom In">
              <IconButton onClick={handleZoomIn} size="small">
                <ZoomIn />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton onClick={handleZoomOut} size="small">
                <ZoomOut />
              </IconButton>
            </Tooltip>
            <Tooltip title="Recenter">
              <IconButton onClick={handleRecenter} size="small">
                <CenterFocusStrong />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <CardContent>
        {/* Map Container */}
        <Box
          ref={mapRef}
          sx={{
            height: 400,
            width: '100%',
            bgcolor: '#f5f5f5',
            borderRadius: 1,
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid #e0e0e0',
          }}
        >
          {/* Simulated Map Background */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(90deg, #e8f5e8 1px, transparent 1px),
                linear-gradient(#e8f5e8 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              opacity: 0.3,
            }}
          />

          {/* Map Markers */}
          {filteredCompetitors.map((competitor, index) => {
            const x = 50 + (index % 5) * 15 + Math.random() * 10;
            const y = 30 + Math.floor(index / 5) * 20 + Math.random() * 10;
            const markerSize = getMarkerSize(competitor);
            const markerColor = getMarkerColor(competitor);

            return (
              <Tooltip
                key={competitor.id}
                title={
                  <Box>
                    <Typography variant="subtitle2">{competitor.name}</Typography>
                    <Typography variant="body2">
                      Occupancy: {competitor.occupancyRate}%
                    </Typography>
                    <Typography variant="body2">
                      Rent: {formatRentRange(competitor.rentRange)}
                    </Typography>
                  </Box>
                }
                placement="top"
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                    width: markerSize,
                    height: markerSize,
                    bgcolor: markerColor,
                    borderRadius: '50%',
                    border: '2px solid white',
                    boxShadow: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'translate(-50%, -50%)',
                    '&:hover': {
                      transform: 'translate(-50%, -50%) scale(1.2)',
                      zIndex: 10,
                    },
                    transition: 'transform 0.2s ease-in-out',
                  }}
                  onClick={() => handleMarkerClick(competitor)}
                >
                  <Business
                    sx={{
                      color: 'white',
                      fontSize: markerSize * 0.6,
                    }}
                  />
                </Box>
              </Tooltip>
            );
          })}

          {/* Map Controls Overlay */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              display: 'flex',
              gap: 1,
            }}
          >
            <Chip
              label={`Zoom: ${zoom}`}
              size="small"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.9)' }}
            />
          </Box>
        </Box>

        {/* Legend */}
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Map Legend
          </Typography>
          <Box display="flex" gap={3} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  bgcolor: '#4caf50',
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: 1,
                }}
              />
              <Typography variant="body2">High Occupancy (95%+)</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  bgcolor: '#ff9800',
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: 1,
                }}
              />
              <Typography variant="body2">Medium Occupancy (85-94%)</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  bgcolor: '#f44336',
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: 1,
                }}
              />
              <Typography variant="body2">Low Occupancy (&lt;85%)</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2">Marker size indicates market share</Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>

      {/* Competitor Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedCompetitor && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: getMarkerColor(selectedCompetitor) }}>
                    <Business />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedCompetitor.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {selectedCompetitor.address}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setDetailDialogOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              {/* Key Metrics */}
              <Box display="flex" gap={2} mb={3}>
                <Box textAlign="center" flex={1}>
                  <Typography variant="h5" color="primary">
                    {selectedCompetitor.occupancyRate}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Occupancy
                  </Typography>
                </Box>
                <Box textAlign="center" flex={1}>
                  <Typography variant="h5" color="primary">
                    {selectedCompetitor.units}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Units
                  </Typography>
                </Box>
                <Box textAlign="center" flex={1}>
                  <Typography variant="h5" color="primary">
                    {selectedCompetitor.marketShare}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Market Share
                  </Typography>
                </Box>
              </Box>

              {/* Rent Range */}
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Rent Range
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatRentRange(selectedCompetitor.rentRange)}
                </Typography>
              </Box>

              {/* Amenities */}
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Amenities
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {selectedCompetitor.amenities.map((amenity) => (
                    <Chip
                      key={amenity}
                      label={amenity}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Box>

              {/* Recent Activity */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Recent Activity
                </Typography>
                <List dense>
                  {selectedCompetitor.recentActivity.slice(0, 3).map((activity) => (
                    <ListItem key={activity.id} divider>
                      <ListItemText
                        primary={activity.description}
                        secondary={activity.date.toLocaleDateString()}
                      />
                      <ConfidenceIndicator
                        confidence={activity.confidence}
                        variant="circular"
                        size="small"
                        colorCoded
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Card>
  );
};

export default CompetitorAnalysisMap;