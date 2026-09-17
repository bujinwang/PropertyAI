# PropertyApp ML Integration

This document describes the Machine Learning (ML) integration in the PropertyFlow AI mobile application.

## Overview

The mobile app now includes comprehensive ML prediction capabilities that provide property managers with AI-powered insights for:

1. **Tenant Churn Prediction** - Identify tenants at risk of not renewing their lease
2. **Maintenance Cost Prediction** - Forecast upcoming maintenance expenses
3. **Occupancy Forecasting** - Predict future occupancy rates
4. **Rent Optimization** - Get data-driven rent recommendations

## Architecture

### Service Layer

**`src/services/mlPredictionService.ts`**
- Centralized service for all ML prediction API calls
- Type-safe interfaces for requests and responses
- Error handling and fallback mechanisms
- Support for both individual and batch predictions

### UI Components

**`src/components/ml/ChurnRiskCard.tsx`**
- Displays tenant churn risk predictions
- Visual risk indicators (low/medium/high)
- Key factors contributing to churn risk
- Actionable recommendations

**`src/components/ml/MaintenancePredictionCard.tsx`**
- Shows predicted maintenance costs
- Cost breakdown by category
- Urgency indicators
- Timeline and confidence metrics

### Screens

**`src/screens/MLInsightsScreen.tsx`**
- Main ML insights dashboard
- Tabbed interface for different prediction types
- Pull-to-refresh functionality
- Loading and error states

## Usage

### Accessing ML Insights

1. Navigate to the Property Manager Dashboard
2. Tap on "ML Insights" quick action
3. View churn predictions or maintenance forecasts
4. Pull down to refresh predictions

### Integration in Navigation

The MLInsights screen is registered in the navigation stack:

```typescript
// In navigation/types.ts
export type RootStackParamList = {
  // ... other routes
  MLInsights: undefined;
};

// Navigate to ML Insights
navigation.navigate('MLInsights');
```

### Using ML Services

#### Predict Tenant Churn

```typescript
import { mlPredictionService } from '@/services/mlPredictionService';

const prediction = await mlPredictionService.predictChurnRisk({
  tenantId: 'tenant123',
  paymentHistory: {
    onTimePayments: 18,
    latePayments: 6,
    totalPayments: 24,
  },
  maintenanceRequests: 8,
  leaseMonthsRemaining: 3,
  communicationFrequency: 12,
});

console.log('Churn Risk:', prediction.prediction);
console.log('Probability:', prediction.probability);
console.log('Factors:', prediction.factors);
```

#### Predict Maintenance Costs

```typescript
const prediction = await mlPredictionService.predictMaintenanceCosts({
  rentalId: 'rental123',
  propertyAge: 15,
  propertyType: 'apartment',
  squareFeet: 1200,
  lastMaintenanceDate: '2024-01-15',
  maintenanceHistory: [
    { date: '2024-01-15', cost: 450, category: 'plumbing' },
    { date: '2023-11-10', cost: 1200, category: 'hvac' },
  ],
  systems: {
    hvac: { age: 12, lastService: '2023-11-10' },
    plumbing: { age: 15, lastService: '2024-01-15' },
  },
});

console.log('Predicted Cost:', prediction.predictedCost);
console.log('Breakdown:', prediction.breakdown);
```

## API Endpoints

All ML predictions are made against the backend ML API:

- `POST /ml/predict/churn` - Predict tenant churn risk
- `POST /ml/predict/churn/batch` - Batch predict churn for multiple tenants
- `GET /ml/predict/churn/history/:tenantId` - Get churn prediction history
- `POST /ml/predict/maintenance` - Predict maintenance costs
- `GET /ml/predict/maintenance/history/:rentalId` - Get maintenance prediction history
- `POST /ml/forecast/occupancy` - Forecast occupancy rates
- `POST /ml/optimize/rent` - Get rent optimization recommendations
- `GET /ml/health` - Check ML model health status

## Features

### Churn Prediction

**Inputs:**
- Payment history (on-time vs. late payments)
- Maintenance request frequency
- Lease months remaining
- Communication frequency with property manager

**Outputs:**
- Risk level (low/medium/high)
- Churn probability (0-1)
- Confidence score
- Key contributing factors with impact scores
- Actionable recommendations

### Maintenance Prediction

**Inputs:**
- Property age and type
- Square footage
- Maintenance history
- Building systems (HVAC, plumbing, electrical, roof)
- Last maintenance dates

**Outputs:**
- Predicted total cost
- Cost range (min/max)
- Confidence score
- Breakdown by category with urgency levels
- Timeline and recommendations

### Occupancy Forecasting

**Inputs:**
- Current occupancy rate
- Historical occupancy data
- Market data (optional)
- Seasonal trends

**Outputs:**
- Next month forecast
- Next quarter forecast
- Confidence score
- Trend analysis
- Recommendations

### Rent Optimization

**Inputs:**
- Current rent amount
- Property features (beds, baths, sqft, amenities)
- Location data
- Market data (optional)

**Outputs:**
- Recommended rent amount
- Market position (below/at/above market)
- Adjustment percentage
- Confidence score
- Market analysis
- Recommendations

## Data Requirements

### For Accurate Predictions

1. **Tenant Data**: At least 6 months of payment history
2. **Maintenance Data**: Historical maintenance costs and dates
3. **Property Data**: Complete property details and system ages
4. **Market Data**: Optional but improves accuracy

### Data Privacy

All ML predictions are performed server-side. No sensitive tenant or property data is stored in the mobile app beyond what's necessary for display.

## Error Handling

The ML service includes comprehensive error handling:

```typescript
try {
  const prediction = await mlPredictionService.predictChurnRisk(data);
  // Handle success
} catch (error) {
  // Error is logged automatically
  // Display user-friendly error message
  console.error('Prediction failed:', error);
}
```

## Performance Considerations

- Predictions are cached on the backend (15 minutes default)
- Batch predictions should be used when predicting for multiple tenants
- Pull-to-refresh clears local cache and fetches fresh predictions
- Loading states prevent UI blocking during API calls

## Testing

### Mock Data

The MLInsightsScreen includes mock tenant and property data for testing:

```typescript
const mockTenants: Tenant[] = [
  {
    id: 'tenant1',
    name: 'John Smith',
    paymentHistory: { onTimePayments: 18, latePayments: 6, totalPayments: 24 },
    // ... other fields
  },
];
```

### Manual Testing

1. Open the Property Manager Dashboard
2. Tap "ML Insights"
3. Verify loading states
4. Check churn predictions display correctly
5. Switch to maintenance tab
6. Verify maintenance predictions display
7. Test pull-to-refresh
8. Test error states (disconnect network)

## Future Enhancements

- [ ] Real-time prediction updates via WebSocket
- [ ] Prediction history charts and trends
- [ ] Export predictions to PDF/CSV
- [ ] Push notifications for high-risk predictions
- [ ] Prediction accuracy feedback mechanism
- [ ] Personalized recommendation actions
- [ ] Integration with calendar for preventive maintenance scheduling
- [ ] Multi-property comparison views
- [ ] Predictive analytics for portfolio optimization

## Troubleshooting

### Predictions Not Loading

1. Check internet connection
2. Verify backend ML API is running
3. Check API endpoint configuration in `constants/api.ts`
4. Review logs for specific error messages

### Inaccurate Predictions

1. Ensure sufficient historical data is available
2. Verify data quality (no missing or corrupted records)
3. Check ML model version and last training date
4. Contact backend team for model retraining if needed

### Performance Issues

1. Use batch predictions for multiple entities
2. Implement result caching on app side
3. Reduce prediction frequency
4. Optimize network requests

## Support

For issues or questions:
- Check backend ML API documentation
- Review backend logs for API errors
- Contact the ML team for model-specific issues
- File issues in the project repository

## Version History

- **v1.0.0** (Current)
  - Initial ML integration
  - Churn and maintenance predictions
  - ML Insights screen
  - PropertyManager Dashboard integration
