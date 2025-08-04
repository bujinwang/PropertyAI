import React, { useState, useEffect } from 'react';
import {
 Box,
 Container,
 Typography,
 Grid,
 Card,
 CardContent,
 Chip,
 IconButton,
 Tabs,
 Tab,
 TextField,
 InputAdornment,
 FormControl,
 InputLabel,
 Select,
 MenuItem,
 Alert,
 Skeleton,
 Fab,
 Badge,
 Drawer,
 useMediaQuery,
 useTheme
} from '@mui/material';
import {
 Search as SearchIcon,
 FilterList as FilterIcon,
 Refresh as RefreshIcon,
 TrendingUp as TrendingUpIcon,
 TrendingDown as TrendingDownIcon,
 AttachMoney as AttachMoneyIcon,
 Settings as SettingsIcon,
 People as PeopleIcon,
 Insights as InsightsIcon
} from '@mui/icons-material';
import { LoadingStateIndicator } from '../design-system/components/ai/LoadingStateIndicator';
import { 
 Insight, 
 InsightCategoryGroup, 
 InsightFilters, 
 InsightsDashboardState,
 InsightCategory,
 InsightPriority
} from '../types/ai-insights';
import { aiInsightsService } from '../services/aiInsightsService';
import { InsightCard, CategorySection, FiltersPanel } from '../components/ai-insights';
import { InsightDetailModal } from '../components/ai-insights/InsightDetailModal';

const AIInsightsDashboard: React.FC = () => {
 const [state, setState] = useState<InsightsDashboardState>({
  categories: [],
  selectedInsight: null,
  filters: {
   categories: [],
   priorities: [],
   timeRange: '30d',
   searchQuery: '',
   sortBy: 'priority',
   sortOrder: 'desc'
  },
  loading: true,
  error: null,
  lastUpdated: null
 });

 const [activeTab, setActiveTab] = useState<number>(0);
 const [showFilters, setShowFilters] = useState(false);
 const [insightModalOpen, setInsightModalOpen] = useState(false);
 const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
 const [dashboardSummary, setDashboardSummary] = useState<any>(null);
 const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
 
 const theme = useTheme();
 const isMobile = useMediaQuery(theme.breakpoints.down('md'));

 // Category icons mapping
 const categoryIcons = {
  financial: AttachMoneyIcon,
  operational: SettingsIcon,
  tenant_satisfaction: PeopleIcon
 };

 // Priority colors
 const priorityColors = {
  critical: '#f44336',
  high: '#ff9800',
  medium: '#2196f3',
  low: '#4caf50'
 };

 // Load insights data
 const loadInsights = async () => {
  try {
   setState(prev => ({ ...prev, loading: true, error: null }));
   
   const [insightsResponse, summary] = await Promise.all([
    aiInsightsService.getInsights(state.filters),
    aiInsightsService.getDashboardSummary()
   ]);
   
   setState(prev => ({
    ...prev,
    categories: insightsResponse.categories,
    loading: false,
    lastUpdated: new Date()
   }));
   
   setDashboardSummary(summary);
  } catch (error) {
   setState(prev => ({
    ...prev,
    loading: false,
    error: error instanceof Error ? error.message : 'Failed to load insights'
   }));
  }
 };

 // Handle filter changes
 const handleFiltersChange = (newFilters: Partial<InsightFilters>) => {
  setState(prev => ({
   ...prev,
   filters: { ...prev.filters, ...newFilters }
  }));
 };

 // Handle search
 const handleSearch = (query: string) => {
  handleFiltersChange({ searchQuery: query });
 };

 // Handle tab change
 const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
  setActiveTab(newValue);
  if (newValue === 0) {
   handleFiltersChange({ categories: [] });
  } else {
   const category = state.categories[newValue - 1]?.category;
   if (category) {
    handleFiltersChange({ categories: [category] });
   }
  }
 };

 // Handle insight click
 const handleInsightClick = (insight: Insight) => {
  setSelectedInsight(insight);
  setInsightModalOpen(true);
 };

 // Handle modal close
 const handleModalClose = () => {
  setInsightModalOpen(false);
  setSelectedInsight(null);
 };

 // Handle insight refresh
 const handleInsightRefresh = async (insightId: string) => {
  await loadInsights();
 };

 // Handle category expansion
 const handleCategoryToggle = (categoryId: string) => {
  setExpandedCategories(prev => ({
   ...prev,
   [categoryId]: !prev[categoryId]
  }));
 };

 // Initialize expanded categories
 useEffect(() => {
  if (state.categories.length > 0) {
   const initialExpanded = state.categories.reduce((acc, category) => {
    acc[category.id] = true;
    return acc;
   }, {} as Record<string, boolean>);
   setExpandedCategories(initialExpanded);
  }
 }, [state.categories]);

 // Get priority badge color
 const getPriorityColor = (priority: InsightPriority) => {
  return priorityColors[priority] || '#757575';
 };

 // Get trend icon
 const getTrendIcon = (trend: string) => {
  switch (trend) {
   case 'up':
    return <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 16 }} />;
   case 'down':
    return <TrendingDownIcon sx={{ color: '#f44336', fontSize: 16 }} />;
   default:
    return null;
  }
 };

 // Load data on mount and filter changes
 useEffect(() => {
  loadInsights();
 }, [state.filters]);

 if (state.loading && state.categories.length === 0) {
  return (
   <Container maxWidth="xl" sx={{ py: 3 }}>
    <LoadingStateIndicator 
     message="Loading AI insights..." 
     variant="skeleton"
    />
   </Container>
  );
 }

 return (
  <Container maxWidth="xl" sx={{ py: 3 }}>
   {/* Header */}
   <Box sx={{ mb: 4 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
     <InsightsIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
     <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
      AI Insights Dashboard
     </Typography>
     <IconButton 
      onClick={loadInsights} 
      disabled={state.loading}
      sx={{ ml: 2 }}
     >
      <RefreshIcon />
     </IconButton>
    </Box>
    
    {state.lastUpdated && (
     <Typography variant="body2" color="text.secondary">
      Last updated: {state.lastUpdated.toLocaleString()}
     </Typography>
    )}
   </Box>

   {/* Error Alert */}
   {state.error && (
    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setState(prev => ({ ...prev, error: null }))}>
     {state.error}
    </Alert>
   )}

   {/* Dashboard Summary */}
   {dashboardSummary && (
    <Grid container spacing={3} sx={{ mb: 4 }}>
     <Grid xs={12} sm={6} md={3}>
      <Card>
       <CardContent>
        <Typography color="text.secondary" gutterBottom variant="body2">
         Total Insights
        </Typography>
        <Typography variant="h4">
         {dashboardSummary.totalInsights}
        </Typography>
       </CardContent>
      </Card>
     </Grid>
     <Grid xs={12} sm={6} md={3}>
      <Card>
       <CardContent>
        <Typography color="text.secondary" gutterBottom variant="body2">
         High Priority
        </Typography>
        <Typography variant="h4" sx={{ color: priorityColors.high }}>
         {dashboardSummary.highPriorityCount}
        </Typography>
       </CardContent>
      </Card>
     </Grid>
     <Grid xs={12} sm={6} md={3}>
      <Card>
       <CardContent>
        <Typography color="text.secondary" gutterBottom variant="body2">
         Avg Confidence
        </Typography>
        <Typography variant="h4">
         {dashboardSummary.avgConfidence}%
        </Typography>
       </CardContent>
      </Card>
     </Grid>
     <Grid xs={12} sm={6} md={3}>
      <Card>
       <CardContent>
        <Typography color="text.secondary" gutterBottom variant="body2">
         Categories
        </Typography>
        <Typography variant="h4">
         {Object.keys(dashboardSummary.categoryCounts).length}
        </Typography>
       </CardContent>
      </Card>
     </Grid>
    </Grid>
   )}

   {/* Search and Filters */}
   <Box sx={{ mb: 3 }}>
    <Grid container spacing={2} alignItems="center">
     <Grid xs={12} md={isMobile ? 8 : 6}>
      <TextField
       fullWidth
       placeholder="Search insights..."
       value={state.filters.searchQuery}
       onChange={(e) => handleSearch(e.target.value)}
       InputProps={{
        startAdornment: (
         <InputAdornment position="start">
          <SearchIcon />
         </InputAdornment>
        )
       }}
      />
     </Grid>
     <Grid xs={12} md={isMobile ? 4 : 2}>
      <IconButton
       onClick={() => setShowFilters(!showFilters)}
       sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        width: '100%',
        height: 56,
        display: 'flex',
        gap: 1
       }}
      >
       <FilterIcon />
       {!isMobile && <Typography>Filters</Typography>}
      </IconButton>
     </Grid>
     {!isMobile && (
      <>
       <Grid md={2}>
        <FormControl fullWidth>
         <InputLabel>Sort By</InputLabel>
         <Select
          value={state.filters.sortBy}
          label="Sort By"
          onChange={(e) => handleFiltersChange({ sortBy: e.target.value as any })}
         >
          <MenuItem value="priority">Priority</MenuItem>
          <MenuItem value="confidence">Confidence</MenuItem>
          <MenuItem value="impact">Impact</MenuItem>
          <MenuItem value="timestamp">Date</MenuItem>
         </Select>
        </FormControl>
       </Grid>
       <Grid md={2}>
        <FormControl fullWidth>
         <InputLabel>Time Range</InputLabel>
         <Select
          value={state.filters.timeRange}
          label="Time Range"
          onChange={(e) => handleFiltersChange({ timeRange: e.target.value as any })}
         >
          <MenuItem value="7d">Last 7 days</MenuItem>
          <MenuItem value="30d">Last 30 days</MenuItem>
          <MenuItem value="90d">Last 90 days</MenuItem>
          <MenuItem value="1y">Last year</MenuItem>
         </Select>
        </FormControl>
       </Grid>
      </>
     )}
    </Grid>
   </Box>

   {/* Category Tabs */}
   <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
    <Tabs value={activeTab} onChange={handleTabChange}>
     <Tab label="All Insights" />
     {state.categories.map((category, index) => {
      const IconComponent = categoryIcons[category.category];
      return (
       <Tab
        key={category.id}
        label={
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconComponent sx={{ fontSize: 18 }} />
          {category.name}
          <Badge 
           badgeContent={category.totalCount} 
           color="primary" 
           sx={{ ml: 1 }}
          />
         </Box>
        }
       />
      );
     })}
    </Tabs>
   </Box>

   {/* Main Content */}
   <Grid container spacing={3}>
    {/* Filters Sidebar */}
    <Grid xs={12} md={3}>
     {isMobile ? (
      <Drawer
       anchor="left"
       open={showFilters}
       onClose={() => setShowFilters(false)}
       sx={{
        '& .MuiDrawer-paper': {
         width: 280,
         p: 2
        }
       }}
      >
       <FiltersPanel
        filters={state.filters}
        onFiltersChange={handleFiltersChange}
        categories={state.categories}
       />
      </Drawer>
     ) : (
      <Box sx={{ position: 'sticky', top: 24 }}>
       <FiltersPanel
        filters={state.filters}
        onFiltersChange={handleFiltersChange}
        categories={state.categories}
       />
      </Box>
     )}
    </Grid>

    {/* Insights Content */}
    <Grid xs={12} md={9}>
     {state.loading && state.categories.length === 0 ? (
      // Loading skeletons
      <Grid container spacing={3}>
       {Array.from({ length: 6 }).map((_, index) => (
        <Grid xs={12} md={6} lg={4} key={index}>
         <Card>
          <CardContent>
           <Skeleton variant="text" width="60%" height={32} />
           <Skeleton variant="text" width="100%" height={20} />
           <Skeleton variant="text" width="100%" height={20} />
           <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
          </CardContent>
         </Card>
        </Grid>
       ))}
      </Grid>
     ) : activeTab === 0 ? (
      // All categories view
      <Box>
       {state.categories.map((category) => (
        <CategorySection
         key={category.id}
         category={category}
         onInsightClick={handleInsightClick}
         expanded={expandedCategories[category.id] ?? true}
         onToggleExpanded={() => handleCategoryToggle(category.id)}
        />
       ))}
      </Box>
     ) : (
      // Single category view
      <Grid container spacing={3}>
       {state.categories
        .filter(category => state.categories[activeTab - 1]?.id === category.id)
        .flatMap(category => category.insights)
        .map((insight) => (
         <Grid xs={12} md={6} lg={4} key={insight.id}>
          <InsightCard
           insight={insight}
           onClick={handleInsightClick}
           showCategory={false}
          />
         </Grid>
        ))}
      </Grid>
     )}
    </Grid>
   </Grid>

   {/* Empty State */}
   {!state.loading && state.categories.every(cat => cat.insights.length === 0) && (
    <Box sx={{ textAlign: 'center', py: 8 }}>
     <InsightsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
     <Typography variant="h6" color="text.secondary" gutterBottom>
      No insights found
     </Typography>
     <Typography variant="body2" color="text.secondary">
      Try adjusting your filters or check back later for new insights.
     </Typography>
    </Box>
   )}

   {/* Floating Action Button for Refresh */}
   <Fab
    color="primary"
    sx={{ position: 'fixed', bottom: 16, right: 16 }}
    onClick={loadInsights}
    disabled={state.loading}
   >
    <RefreshIcon />
   </Fab>

   {/* Insight Detail Modal */}
   <InsightDetailModal
    open={insightModalOpen}
    insight={selectedInsight}
    onClose={handleModalClose}
    onRefresh={handleInsightRefresh}
   />
  </Container>
 );
};

export default AIInsightsDashboard;
