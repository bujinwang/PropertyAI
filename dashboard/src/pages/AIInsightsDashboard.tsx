import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Badge,
  Grid,
} from '@mui/material';
import {
  Insights as InsightsIcon,
  AttachMoney as AttachMoneyIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { aiInsightsService } from '../services/aiInsightsService';
import { InsightsDashboardState, InsightCategoryGroup, Insight } from '../types/ai-insights';
import CategorySection from '../components/ai-insights/CategorySection';
import InsightCard from '../components/ai-insights/InsightCard';
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
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Category icons mapping
  const categoryIcons = {
    financial: AttachMoneyIcon,
    operational: SettingsIcon,
    tenant_satisfaction: PeopleIcon
  };

  useEffect(() => {
    const loadInsights = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const insightsResponse = await aiInsightsService.getInsights(state.filters);
        console.log("API Response Data:", insightsResponse);
        setState(prev => ({
          ...prev,
          categories: insightsResponse.data.categories || [],
          loading: false,
          lastUpdated: new Date()
        }));
      } catch (error) {
        console.error("Error loading insights:", error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load insights'
        }));
      }
    };

    loadInsights();
  }, [state.filters]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 0) {
      setState(prev => ({ ...prev, filters: { ...prev.filters, categories: [] } }));
    } else {
      const category = state.categories[newValue - 1]?.category;
      if (category) {
        setState(prev => ({ ...prev, filters: { ...prev.filters, categories: [category] } }));
      }
    }
  };

  // Handle category expansion
  const handleCategoryToggle = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Handle insight click to show detail modal
  const handleInsightClick = (insight: Insight) => {
    setState(prev => ({ ...prev, selectedInsight: insight }));
  };

  // Handle modal close
  const handleCloseModal = () => {
    setState(prev => ({ ...prev, selectedInsight: null }));
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

  console.log("Current State:", state);

  if (state.loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography>Loading AI insights...</Typography>
      </Container>
    );
  }

  if (state.error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography color="error">{state.error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InsightsIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            AI Insights Dashboard
          </Typography>
        </Box>
      </Box>

      {/* Category Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="All Insights" />
          {state.categories.map((category: InsightCategoryGroup, index: number) => {
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
        <Grid item xs={12} md={9}>
          {activeTab === 0 ? (
            // All categories view
            <Box>
              {state.categories.map((category: InsightCategoryGroup) => (
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
                .filter((category: InsightCategoryGroup) => activeTab > 0 && state.categories[activeTab - 1]?.id === category.id)
                .flatMap((category: InsightCategoryGroup) => category.insights)
                .map((insight: Insight) => {
                  console.log("Rendering InsightCard for insight:", insight);
                  if (!insight) return null; // Defensive check
                  return (
                    <Grid item xs={12} md={6} lg={4} key={insight.id}>
                      <InsightCard
                        insight={insight}
                        onClick={handleInsightClick}
                        showCategory={false}
                      />
                    </Grid>
                  );
                })}
            </Grid>
          )}
        </Grid>
      </Grid>

      {/* Insight Detail Modal */}
      {state.selectedInsight && (
        <InsightDetailModal
          insight={state.selectedInsight}
          open={!!state.selectedInsight}
          onClose={handleCloseModal}
        />
      )}
    </Container>
  );
};

export default AIInsightsDashboard;