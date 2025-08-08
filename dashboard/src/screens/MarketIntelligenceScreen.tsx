// ... existing code ...

return (
  <Container maxWidth="xl" sx={{ py: 3 }}>
    <Grid container spacing={3}>
      {/* Header */}
      <Grid size={12}>
        <Typography variant="h4" component="h1" gutterBottom>
          Market Intelligence
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          AI-powered insights to optimize your rental strategy and maximize returns.
        </Typography>
      </Grid>

      {/* Market Summary */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Market Summary
            </Typography>
            {marketSummary ? (
              <AIGeneratedContent
                confidence={marketSummary.confidence}
                explanation="AI-generated market analysis based on current data"
                onFeedback={(feedback) => console.log('Market summary feedback:', feedback)}
              >
                <Typography variant="body1" paragraph>
                  {marketSummary.content}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Key Insights:
                  </Typography>
                  <List dense>
                    {marketSummary.keyInsights?.map((insight, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <TrendingUpIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={insight} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </AIGeneratedContent>
            ) : (
              <CircularProgress />
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Competitor Analysis and Market Opportunities */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Competitor Analysis
            </Typography>
            {competitors.length > 0 ? (
              <List>
                {competitors.map((competitor) => (
                  <ListItem key={competitor.id}>
                    <ListItemText
                      primary={competitor.name}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            Avg Rent: ${competitor.averageRent} | Vacancy: {(competitor.vacancyRate * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {competitor.recentActivity}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <CircularProgress />
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Market Opportunities
            </Typography>
            {opportunities.length > 0 ? (
              <List>
                {opportunities.map((opportunity) => (
                  <ListItem key={opportunity.id}>
                    <ListItemText
                      primary={opportunity.title}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {opportunity.description}
                          </Typography>
                          <Chip
                            label={`+$${opportunity.potentialIncrease}`}
                            color="success"
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <CircularProgress />
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Market Trends */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Market Trends
            </Typography>
            {trends.length > 0 ? (
              <Grid container spacing={2}>
                {trends.map((trend) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={trend.id}>
                    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {trend.metric}
                      </Typography>
                      <Typography variant="h6">
                        {trend.metric.includes('Rate') ? `${trend.currentValue}%` : `$${trend.currentValue}`}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        {trend.trend === 'increasing' ? (
                          <TrendingUpIcon color="success" fontSize="small" />
                        ) : (
                          <TrendingDownIcon color="error" fontSize="small" />
                        )}
                        <Typography
                          variant="body2"
                          color={trend.trend === 'increasing' ? 'success.main' : 'error.main'}
                          sx={{ ml: 0.5 }}
                        >
                          {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <CircularProgress />
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Demand Forecasts */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Demand Forecasts
            </Typography>
            {forecasts.length > 0 ? (
              <Grid container spacing={2}>
                {forecasts.map((forecast) => (
                  <Grid size={{ xs: 12, md: 6 }} key={forecast.id}>
                    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {forecast.period}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ mr: 1 }}>
                          {(forecast.demandScore * 100).toFixed(0)}%
                        </Typography>
                        <Chip
                          label={`${(forecast.confidence * 100).toFixed(0)}% confidence`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {forecast.recommendation}
                      </Typography>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Key factors: {forecast.factors.join(', ')}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <CircularProgress />
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Container>
);

// ... existing code ...