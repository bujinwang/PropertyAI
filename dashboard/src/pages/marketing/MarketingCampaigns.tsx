import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

interface Campaign {
  id: string;
  name: string;
  type: 'google_ads' | 'facebook' | 'zillow' | 'apartments_com';
  status: 'active' | 'paused' | 'draft' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  leads: number;
  startDate: string;
  endDate: string;
}

const MarketingCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'google_ads' as Campaign['type'],
    budget: 0,
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    // Mock data - replace with actual API call
    setCampaigns([
      {
        id: '1',
        name: 'Downtown Luxury Apartments',
        type: 'google_ads',
        status: 'active',
        budget: 2000,
        spent: 1250,
        impressions: 45000,
        clicks: 890,
        leads: 23,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      {
        id: '2',
        name: 'Suburban Family Homes',
        type: 'facebook',
        status: 'paused',
        budget: 1500,
        spent: 800,
        impressions: 32000,
        clicks: 650,
        leads: 18,
        startDate: '2024-01-15',
        endDate: '2024-02-15'
      }
    ]);
  }, []);

  const handleCreateCampaign = () => {
    setSelectedCampaign(null);
    setFormData({
      name: '',
      type: 'google_ads',
      budget: 0,
      startDate: '',
      endDate: ''
    });
    setOpenDialog(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      type: campaign.type,
      budget: campaign.budget,
      startDate: campaign.startDate,
      endDate: campaign.endDate
    });
    setOpenDialog(true);
  };

  const handleSaveCampaign = () => {
    // TODO: Implement API call to save campaign
    console.log('Saving campaign:', formData);
    setOpenDialog(false);
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'draft': return 'default';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const getTypeLabel = (type: Campaign['type']) => {
    switch (type) {
      case 'google_ads': return 'Google Ads';
      case 'facebook': return 'Facebook';
      case 'zillow': return 'Zillow';
      case 'apartments_com': return 'Apartments.com';
      default: return type;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Advertising Campaigns
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateCampaign}
        >
          Create Campaign
        </Button>
      </Box>

      {/* Campaign Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Campaigns
              </Typography>
              <Typography variant="h4">
                {campaigns.filter(c => c.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Budget
              </Typography>
              <Typography variant="h4">
                ${campaigns.reduce((sum, c) => sum + c.budget, 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Leads
              </Typography>
              <Typography variant="h4">
                {campaigns.reduce((sum, c) => sum + c.leads, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg. Cost per Lead
              </Typography>
              <Typography variant="h4">
                ${Math.round(campaigns.reduce((sum, c) => sum + c.spent, 0) / campaigns.reduce((sum, c) => sum + c.leads, 0)) || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Campaigns Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Campaign Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Budget</TableCell>
              <TableCell align="right">Spent</TableCell>
              <TableCell align="right">Leads</TableCell>
              <TableCell align="right">Cost/Lead</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>{campaign.name}</TableCell>
                <TableCell>{getTypeLabel(campaign.type)}</TableCell>
                <TableCell>
                  <Chip
                    label={campaign.status}
                    color={getStatusColor(campaign.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">${campaign.budget.toLocaleString()}</TableCell>
                <TableCell align="right">${campaign.spent.toLocaleString()}</TableCell>
                <TableCell align="right">{campaign.leads}</TableCell>
                <TableCell align="right">
                  ${campaign.leads > 0 ? Math.round(campaign.spent / campaign.leads) : 0}
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleEditCampaign(campaign)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small">
                    <ViewIcon />
                  </IconButton>
                  <IconButton size="small">
                    {campaign.status === 'active' ? <PauseIcon /> : <PlayIcon />}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Campaign Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCampaign ? 'Edit Campaign' : 'Create New Campaign'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Campaign Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Platform</InputLabel>
                <Select
                  value={formData.type}
                  label="Platform"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Campaign['type'] })}
                >
                  <MenuItem value="google_ads">Google Ads</MenuItem>
                  <MenuItem value="facebook">Facebook</MenuItem>
                  <MenuItem value="zillow">Zillow</MenuItem>
                  <MenuItem value="apartments_com">Apartments.com</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveCampaign} variant="contained">
            {selectedCampaign ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarketingCampaigns;