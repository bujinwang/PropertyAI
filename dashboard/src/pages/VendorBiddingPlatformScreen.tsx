import React, { useState, useEffect } from 'react';
import {
 Box,
 Typography,
 Paper,
 Button,
 TextField,
 Select,
 MenuItem,
 FormControl,
 InputLabel,
 Table,
 TableBody,
 TableCell,
 TableContainer,
 TableHead,
 TableRow,
 Chip,
 Dialog,
 DialogTitle,
 DialogContent,
 DialogActions,
 Grid,
 Card,
 CardContent,
 IconButton,
 Tooltip,
} from '@mui/material';
import {
 Add as AddIcon,
 Compare as CompareIcon,
 Description as DocumentIcon,
 Message as MessageIcon,
 CheckCircle as CheckCircleIcon,
 Cancel as CancelIcon,
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface RFQ {
 id: string;
 title: string;
 description: string;
 category: string;
 deadline: string;
 status: 'draft' | 'published' | 'closed';
 vendorCount: number;
 budgetRange: {
  min: number;
  max: number;
 };
}

interface Bid {
 id: string;
 vendorId: string;
 vendorName: string;
 amount: number;
 duration: string;
 status: 'submitted' | 'review' | 'accepted' | 'rejected';
 submittedAt: string;
 documents: string[];
 rating: number;
}

interface Vendor {
 id: string;
 name: string;
 category: string;
 rating: number;
 certifications: string[];
 verified: boolean;
}

const VendorBiddingPlatformScreen: React.FC = () => {
 const [rfqs, setRfqs] = useState<RFQ[]>([]);
 const [bids, setBids] = useState<Bid[]>([]);
 const [vendors, setVendors] = useState<Vendor[]>([]);
 const [showRFQForm, setShowRFQForm] = useState(false);
 const [selectedRFQ, setSelectedRFQ] = useState<string | null>(null);
 const [showBidComparison, setShowBidComparison] = useState(false);
 const [newRFQ, setNewRFQ] = useState({
  title: '',
  description: '',
  category: '',
  deadline: '',
  budgetMin: 0,
  budgetMax: 0,
 });

 useEffect(() => {
  loadData();
 }, []);

 const loadData = async () => {
  try {
   const [rfqsData, bidsData, vendorsData] = await Promise.all([
    apiService.get('/api/vendor-bidding/rfqs'),
    apiService.get('/api/vendor-bidding/bids'),
    apiService.get('/api/vendor-bidding/vendors'),
   ]);
   setRfqs(rfqsData.data);
   setBids(bidsData.data);
   setVendors(vendorsData.data);
  } catch (error) {
   console.error('Error loading data:', error);
  }
 };

 const handleCreateRFQ = async () => {
  try {
   await apiService.post('/api/vendor-bidding/rfqs', newRFQ);
   setShowRFQForm(false);
   setNewRFQ({
    title: '',
    description: '',
    category: '',
    deadline: '',
    budgetMin: 0,
    budgetMax: 0,
   });
   loadData();
  } catch (error) {
   console.error('Error creating RFQ:', error);
  }
 };

 const handleAcceptBid = async (bidId: string) => {
  try {
   await apiService.put(`/api/vendor-bidding/bids/${bidId}/accept`);
   loadData();
  } catch (error) {
   console.error('Error accepting bid:', error);
  }
 };

 const handleRejectBid = async (bidId: string) => {
  try {
   await apiService.put(`/api/vendor-bidding/bids/${bidId}/reject`);
   loadData();
  } catch (error) {
   console.error('Error rejecting bid:', error);
  }
 };

 const getStatusColor = (status: string) => {
  switch (status) {
   case 'published': return 'success';
   case 'draft': return 'warning';
   case 'closed': return 'error';
   case 'accepted': return 'success';
   case 'rejected': return 'error';
   case 'submitted': return 'info';
   default: return 'default';
  }
 };

 const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
   style: 'currency',
   currency: 'USD',
  }).format(amount);
 };

 return (
  <Box sx={{ p: 3 }}>
   <Typography variant="h4" gutterBottom>
    Vendor Bidding Platform
   </Typography>

   <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Typography variant="h6" color="text.secondary">
     Manage RFQs and vendor bids efficiently
    </Typography>
    <Button
     variant="contained"
     startIcon={<AddIcon />}
     onClick={() => setShowRFQForm(true)}
    >
     Create RFQ
    </Button>
   </Box>

   <Grid container spacing={3} sx={{ mb: 3 }}>
    <Grid xs={12} md={3}>
     <Card>
      <CardContent>
       <Typography variant="h6" color="primary">
        Active RFQs
       </Typography>
       <Typography variant="h3">
        {rfqs.filter(r => r.status === 'published').length}
       </Typography>
      </CardContent>
     </Card>
    </Grid>
    <Grid xs={12} md={3}>
     <Card>
      <CardContent>
       <Typography variant="h6" color="secondary">
        Open Bids
       </Typography>
       <Typography variant="h3">
        {bids.filter(b => b.status === 'submitted').length}
       </Typography>
      </CardContent>
     </Card>
    </Grid>
    <Grid xs={12} md={3}>
     <Card>
      <CardContent>
       <Typography variant="h6" color="success">
        Verified Vendors
       </Typography>
       <Typography variant="h3">
        {vendors.filter(v => v.verified).length}
       </Typography>
      </CardContent>
     </Card>
    </Grid>
    <Grid xs={12} md={3}>
     <Card>
      <CardContent>
       <Typography variant="h6" color="info">
        Total Savings
       </Typography>
       <Typography variant="h3">
        {formatCurrency(12500)}
       </Typography>
      </CardContent>
     </Card>
    </Grid>
   </Grid>

   <Paper sx={{ mb: 3 }}>
    <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
     Active RFQs
    </Typography>
    <TableContainer>
     <Table>
      <TableHead>
       <TableRow>
        <TableCell>Title</TableCell>
        <TableCell>Category</TableCell>
        <TableCell>Deadline</TableCell>
        <TableCell>Budget Range</TableCell>
        <TableCell>Vendors</TableCell>
        <TableCell>Status</TableCell>
        <TableCell>Actions</TableCell>
       </TableRow>
      </TableHead>
      <TableBody>
       {rfqs.map((rfq) => (
        <TableRow key={rfq.id}>
         <TableCell>{rfq.title}</TableCell>
         <TableCell>{rfq.category}</TableCell>
         <TableCell>{new Date(rfq.deadline).toLocaleDateString()}</TableCell>
         <TableCell>{formatCurrency(rfq.budgetRange.min)} - {formatCurrency(rfq.budgetRange.max)}</TableCell>
         <TableCell>{rfq.vendorCount}</TableCell>
         <TableCell>
          <Chip label={rfq.status} color={getStatusColor(rfq.status) as any} size="small" />
         </TableCell>
         <TableCell>
          <Box sx={{ display: 'flex', gap: 1 }}>
           <Tooltip title="View Bids">
            <IconButton
             onClick={() => {
              setSelectedRFQ(rfq.id);
              setShowBidComparison(true);
             }}
            >
             <CompareIcon />
            </IconButton>
           </Tooltip>
           <Tooltip title="Generate Contract">
            <IconButton>
             <DocumentIcon />
            </IconButton>
           </Tooltip>
          </Box>
         </TableCell>
        </TableRow>
       ))}
      </TableBody>
     </Table>
    </TableContainer>
   </Paper>

   <Dialog open={showRFQForm} onClose={() => setShowRFQForm(false)} maxWidth="md" fullWidth>
    <DialogTitle>Create New RFQ</DialogTitle>
    <DialogContent>
     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
      <TextField
       label="Title"
       value={newRFQ.title}
       onChange={(e) => setNewRFQ({ ...newRFQ, title: e.target.value })}
       fullWidth
      />
      <TextField
       label="Description"
       value={newRFQ.description}
       onChange={(e) => setNewRFQ({ ...newRFQ, description: e.target.value })}
       fullWidth
       multiline
       rows={4}
      />
      <FormControl fullWidth>
       <InputLabel>Category</InputLabel>
       <Select
        value={newRFQ.category}
        onChange={(e) => setNewRFQ({ ...newRFQ, category: e.target.value })}
       >
        <MenuItem value="electrical">Electrical</MenuItem>
        <MenuItem value="plumbing">Plumbing</MenuItem>
        <MenuItem value="hvac">HVAC</MenuItem>
        <MenuItem value="landscaping">Landscaping</MenuItem>
        <MenuItem value="painting">Painting</MenuItem>
        <MenuItem value="general">General Maintenance</MenuItem>
       </Select>
      </FormControl>
      <TextField
       label="Deadline"
       type="date"
       value={newRFQ.deadline}
       onChange={(e) => setNewRFQ({ ...newRFQ, deadline: e.target.value })}
       fullWidth
       InputLabelProps={{ shrink: true }}
      />
      <Box sx={{ display: 'flex', gap: 2 }}>
       <TextField
        label="Minimum Budget"
        type="number"
        value={newRFQ.budgetMin}
        onChange={(e) => setNewRFQ({ ...newRFQ, budgetMin: Number(e.target.value) })}
        fullWidth
       />
       <TextField
        label="Maximum Budget"
        type="number"
        value={newRFQ.budgetMax}
        onChange={(e) => setNewRFQ({ ...newRFQ, budgetMax: Number(e.target.value) })}
        fullWidth
       />
      </Box>
     </Box>
    </DialogContent>
    <DialogActions>
     <Button onClick={() => setShowRFQForm(false)}>Cancel</Button>
     <Button onClick={handleCreateRFQ} variant="contained">Create RFQ</Button>
    </DialogActions>
   </Dialog>

   <Dialog
    open={showBidComparison}
    onClose={() => {
     setShowBidComparison(false);
     setSelectedRFQ(null);
    }}
    maxWidth="lg"
    fullWidth
   >
    <DialogTitle>Bid Comparison</DialogTitle>
    <DialogContent>
     <TableContainer>
      <Table>
       <TableHead>
        <TableRow>
         <TableCell>Vendor</TableCell>
         <TableCell>Amount</TableCell>
         <TableCell>Duration</TableCell>
         <TableCell>Rating</TableCell>
         <TableCell>Status</TableCell>
         <TableCell>Actions</TableCell>
        </TableRow>
       </TableHead>
       <TableBody>
        {bids
         .filter(b => selectedRFQ ? b.vendorId === selectedRFQ : true)
         .map((bid) => (
          <TableRow key={bid.id}>
           <TableCell>{bid.vendorName}</TableCell>
           <TableCell>{formatCurrency(bid.amount)}</TableCell>
           <TableCell>{bid.duration}</TableCell>
           <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <Typography>{bid.rating}/5</Typography>
            </Box>
           </TableCell>
           <TableCell>
            <Chip label={bid.status} color={getStatusColor(bid.status) as any} size="small" />
           </TableCell>
           <TableCell>
            <Box sx={{ display: 'flex', gap: 1 }}>
             <Tooltip title="Accept Bid">
              <IconButton
               onClick={() => handleAcceptBid(bid.id)}
               color="success"
               disabled={bid.status !== 'submitted'}
              >
               <CheckCircleIcon />
              </IconButton>
             </Tooltip>
             <Tooltip title="Reject Bid">
              <IconButton
               onClick={() => handleRejectBid(bid.id)}
               color="error"
               disabled={bid.status !== 'submitted'}
              >
               <CancelIcon />
              </IconButton>
             </Tooltip>
             <Tooltip title="Message Vendor">
              <IconButton>
               <MessageIcon />
              </IconButton>
             </Tooltip>
            </Box>
           </TableCell>
          </TableRow>
         ))}
       </TableBody>
      </Table>
     </TableContainer>
    </DialogContent>
    <DialogActions>
     <Button onClick={() => {
      setShowBidComparison(false);
      setSelectedRFQ(null);
     }}>Close</Button>
    </DialogActions>
   </Dialog>
  </Box>
 );
};

export default VendorBiddingPlatformScreen;