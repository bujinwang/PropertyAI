import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  Avatar,
  Chip
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  Analytics as AnalyticsIcon,
  LocalOffer as PromotionIcon,
  Sync as SyndicationIcon,
  TrendingUp,
  Visibility,
  MonetizationOn,
  Share
} from '@mui/icons-material';

const Marketing = () => {
  const marketingModules = [
    {
      title: 'Advertising Campaigns',
      description: 'Create and manage advertising campaigns across Google Ads, Facebook, Zillow, and other platforms',
      icon: <CampaignIcon />,
      path: '/marketing/campaigns',
      color: '#1976d2',
      stats: '12 Active Campaigns',
      features: ['Google Ads', 'Facebook Ads', 'Zillow', 'Performance Tracking']
    },
    {
      title: 'Marketing Analytics',
      description: 'Track website traffic, lead sources, conversion rates, and marketing performance metrics',
      icon: <AnalyticsIcon />,
      path: '/marketing/analytics',
      color: '#388e3c',
      stats: '2.4K Monthly Visitors',
      features: ['Traffic Analysis', 'Lead Tracking', 'Conversion Funnel', 'ROI Reports']
    },
    {
      title: 'Promotions & Offers',
      description: 'Create discount codes, special offers, and promotional campaigns to attract tenants',
      icon: <PromotionIcon />,
      path: '/marketing/promotions',
      color: '#f57c00',
      stats: '8 Active Promotions',
      features: ['Discount Codes', 'Special Offers', 'Usage Tracking', 'Auto-Apply Rules']
    },
    {
      title: 'Listing Syndication',
      description: 'Automatically sync your property listings across multiple rental platforms and websites',
      icon: <SyndicationIcon />,
      path: '/marketing/syndication',
      color: '#7b1fa2',
      stats: '4 Connected Platforms',
      features: ['Auto-Sync', 'Multi-Platform', 'Real-time Updates', 'Performance Metrics']
    }
  ];

  const quickStats = [
    {
      label: 'Monthly Leads',
      value: '247',
      change: '+12%',
      icon: <TrendingUp />,
      color: 'success'
    },
    {
      label: 'Website Views',
      value: '12.4K',
      change: '+8%',
      icon: <Visibility />,
      color: 'primary'
    },
    {
      label: 'Marketing Spend',
      value: '$3,200',
      change: '-5%',
      icon: <MonetizationOn />,
      color: 'warning'
    },
    {
      label: 'Active Listings',
      value: '156',
      change: '+3%',
      icon: <Share />,
      color: 'info'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Marketing Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your property marketing campaigns, track performance, and optimize your rental business growth
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      {stat.label}
                    </Typography>
                    <Typography variant="h5" component="div">
                      {stat.value}
                    </Typography>
                    <Chip 
                      label={stat.change} 
                      size="small" 
                      color={stat.color as any}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Avatar sx={{ bgcolor: `${stat.color}.main`, width: 56, height: 56 }}>
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Marketing Modules */}
      <Grid container spacing={3}>
        {marketingModules.map((module, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: module.color, mr: 2 }}>
                    {module.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="h2">
                      {module.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {module.stats}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {module.description}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {module.features.map((feature, featureIndex) => (
                    <Chip 
                      key={featureIndex}
                      label={feature} 
                      size="small" 
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
              
              <CardActions>
                <Button 
                  component={Link} 
                  to={module.path}
                  variant="contained"
                  fullWidth
                  sx={{ bgcolor: module.color, '&:hover': { bgcolor: module.color, opacity: 0.9 } }}
                >
                  Open {module.title}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Marketing;
