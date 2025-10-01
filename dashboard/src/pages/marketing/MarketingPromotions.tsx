import React, { useState, useEffect } from 'react';
import { marketingService } from '../../services/marketingService';
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
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

interface Promotion {
  id: string;
  name: string;
  type: 'discount' | 'free_month' | 'waived_fee' | 'gift_card';
  status: 'active' | 'scheduled' | 'expired' | 'draft';
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  description: string;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageCount: number;
  properties: string[];
  code: string;
  autoApply: boolean;
}

const MarketingPromotions: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    type: 'discount' as Promotion['type'],
    discountType: 'percentage' as Promotion['discountType'],
    discountValue: 0,
    description: '',
    startDate: '',
    endDate: '',
    usageLimit: 100,
    code: '',
    autoApply: false,
    properties: [] as string[]
  });

  useEffect(() => {
    // Mock data - replace with actual API call
    setPromotions([
      {
        id: '1',
        name: 'New Year Special',
        type: 'discount',
        status: 'active',
        discountType: 'percentage',
        discountValue: 15,
        description: '15% off first month rent',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        usageLimit: 100,
        usageCount: 23,
        properties: ['Downtown Loft', 'City Center Apt'],
        code: 'NEWYEAR15',
        autoApply: false
      },
      {
        id: '2',
        name: 'First Month Free',
        type: 'free_month',
        status: 'scheduled',
        discountType: 'fixed_amount',
        discountValue: 0,
        description: 'Get your first month free on 12+ month leases',
        startDate: '2024-02-01',
        endDate: '2024-02-29',
        usageLimit: 50,
        usageCount: 0,
        properties: ['Suburban Home', 'Garden View'],
        code: 'FREEMONTH',
        autoApply: true
      },
      {
        id: '3',
        name: 'No Security Deposit',
        type: 'waived_fee',
        status: 'active',
        discountType: 'fixed_amount',
        discountValue: 500,
        description: 'Security deposit waived for qualified applicants',
        startDate: '2024-01-15',
        endDate: '2024-03-15',
        usageLimit: 25,
        usageCount: 8,
        properties: ['Waterfront Condo'],
        code: 'NODEPOSIT',
        autoApply: false
      }
    ]);
  }, []);

  const handleCreatePromotion = () => {
    setSelectedPromotion(null);
    setFormData({
      name: '',
      type: 'discount',
      discountType: 'percentage',
      discountValue: 0,
      description: '',
      startDate: '',
      endDate: '',
      usageLimit: 100,
      code: '',
      autoApply: false,
      properties: []
    });
    setOpenDialog(true);
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setFormData({
      name: promotion.name,
      type: promotion.type,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      description: promotion.description,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      usageLimit: promotion.usageLimit,
      code: promotion.code,
      autoApply: promotion.autoApply,
      properties: promotion.properties
    });
    setOpenDialog(true);
  };

  const handleSavePromotion = async () => {
    try {
      if (selectedPromotion) {
        await marketingService.updatePromotion(selectedPromotion.id, formData);
      } else {
        await marketingService.createPromotion(formData);
      }
      setOpenDialog(false);
      // Reload promotions
      const response = await marketingService.getPromotions();
      setPromotions(response.data || []);
    } catch (error) {
      console.error('Error saving promotion:', error);
    }
  };

  const generatePromotionCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setFormData({ ...formData, code });
  };

  const getStatusColor = (status: Promotion['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'scheduled': return 'info';
      case 'expired': return 'default';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const getTypeLabel = (type: Promotion['type']) => {
    switch (type) {
      case 'discount': return 'Discount';
      case 'free_month': return 'Free Month';
      case 'waived_fee': return 'Waived Fee';
      case 'gift_card': return 'Gift Card';
      default: return type;
    }
  };

  const activePromotions = promotions.filter(p => p.status === 'active');
  const scheduledPromotions = promotions.filter(p => p.status === 'scheduled');
  const expiredPromotions = promotions.filter(p => p.status === 'expired');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Marketing Promotions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreatePromotion}
        >
          Create Promotion
        </Button>
      </Box>

      {/* Promotion Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Promotions
              </Typography>
              <Typography variant="h4">
                {activePromotions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Usage
              </Typography>
              <Typography variant="h4">
                {promotions.reduce((sum, p) => sum + p.usageCount, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg. Usage Rate
              </Typography>
              <Typography variant="h4">
                {Math.round(promotions.reduce((sum, p) => sum + (p.usageCount / p.usageLimit * 100), 0) / promotions.length)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Scheduled
              </Typography>
              <Typography variant="h4">
                {scheduledPromotions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different promotion categories */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Active (${activePromotions.length})`} />
          <Tab label={`Scheduled (${scheduledPromotions.length})`} />
          <Tab label={`Expired (${expiredPromotions.length})`} />
          <Tab label="All" />
        </Tabs>
      </Box>

      {/* Promotions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Promotion Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Usage</TableCell>
              <TableCell>Valid Until</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tabValue === 0 ? activePromotions :
              tabValue === 1 ? scheduledPromotions :
              tabValue === 2 ? expiredPromotions :
              promotions).map((promotion) => (
              <TableRow key={promotion.id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">{promotion.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {promotion.description}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{getTypeLabel(promotion.type)}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {promotion.code}
                    </Typography>
                    <IconButton size="small" onClick={() => navigator.clipboard.writeText(promotion.code)}>
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={promotion.status}
                    color={getStatusColor(promotion.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {promotion.usageCount} / {promotion.usageLimit}
                  <Typography variant="body2" color="textSecondary">
                    ({Math.round(promotion.usageCount / promotion.usageLimit * 100)}%)
                  </Typography>
                </TableCell>
                <TableCell>{new Date(promotion.endDate).toLocaleDateString()}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleEditPromotion(promotion)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small">
                    <ViewIcon />
                  </IconButton>
                  <IconButton size="small">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Promotion Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPromotion ? 'Edit Promotion' : 'Create New Promotion'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Promotion Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Promotion Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Promotion Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Promotion['type'] })}
                >
                  <MenuItem value="discount">Discount</MenuItem>
                  <MenuItem value="free_month">Free Month</MenuItem>
                  <MenuItem value="waived_fee">Waived Fee</MenuItem>
                  <MenuItem value="gift_card">Gift Card</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Promotion Code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
                <Button onClick={generatePromotionCode} variant="outlined">
                  Generate
                </Button>
              </Box>
            </Grid>
            {formData.type === 'discount' && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Discount Type</InputLabel>
                    <Select
                      value={formData.discountType}
                      label="Discount Type"
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as Promotion['discountType'] })}
                    >
                      <MenuItem value="percentage">Percentage</MenuItem>
                      <MenuItem value="fixed_amount">Fixed Amount</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Discount Value"
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    InputProps={{
                      startAdornment: formData.discountType === 'fixed_amount' ? '$' : '',
                      endAdornment: formData.discountType === 'percentage' ? '%' : ''
                    }}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Usage Limit"
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.autoApply}
                    onChange={(e) => setFormData({ ...formData, autoApply: e.target.checked })}
                  />
                }
                label="Auto-apply to eligible properties"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePromotion} variant="contained">
            {selectedPromotion ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarketingPromotions;