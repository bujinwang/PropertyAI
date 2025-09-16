# UAT Test Data Setup Guide

## Overview

This guide outlines the process for setting up realistic test data in the staging environment for Epic 21 User Acceptance Testing. The test data should represent real-world scenarios while maintaining data privacy and security.

## Test Data Requirements

### User Accounts

#### Primary Test Users
```json
[
  {
    "role": "Property Manager",
    "email": "sarah.johnson@propertyai.com",
    "name": "Sarah Johnson",
    "properties": ["downtown-office", "suburban-complex"],
    "permissions": ["read", "write", "admin"]
  },
  {
    "role": "Administrator",
    "email": "mike.chen@propertyai.com",
    "name": "Mike Chen",
    "properties": ["all"],
    "permissions": ["read", "write", "admin", "system"]
  },
  {
    "role": "Tenant",
    "email": "jennifer.smith@tenant.com",
    "name": "Jennifer Smith",
    "properties": ["suburban-complex"],
    "unit": "Unit 3B",
    "permissions": ["read"]
  }
]
```

#### Additional Test Users (5 total per role)
- 2 more Property Managers with different property portfolios
- 2 more Administrators with varying access levels
- 2 more Tenants with different tenancy durations

### Test Properties

#### Downtown Office Building
```json
{
  "id": "downtown-office",
  "type": "Office",
  "units": 50,
  "sqft": 75000,
  "yearBuilt": 2015,
  "location": {
    "address": "123 Business District, Downtown",
    "coordinates": [40.7128, -74.0060]
  },
  "features": {
    "maintenance": "High - Modern building with complex systems",
    "market": "Premium location with high demand",
    "risk": "Mixed - High value but urban location risks"
  }
}
```

#### Suburban Apartment Complex
```json
{
  "id": "suburban-complex",
  "type": "Residential",
  "units": 120,
  "sqft": 95000,
  "yearBuilt": 2008,
  "location": {
    "address": "456 Suburban Plaza, Suburbia",
    "coordinates": [40.7589, -73.9851]
  },
  "features": {
    "maintenance": "Medium - Standard residential systems",
    "market": "Stable family-oriented area",
    "risk": "Low - Established suburban location"
  }
}
```

#### Residential Condos
```json
{
  "id": "residential-condos",
  "type": "Condominium",
  "units": 80,
  "sqft": 60000,
  "yearBuilt": 2018,
  "location": {
    "address": "789 Luxury Lane, Uptown",
    "coordinates": [40.7831, -73.9712]
  },
  "features": {
    "maintenance": "Low - Modern construction with quality materials",
    "market": "High-end luxury market",
    "risk": "Low - Premium location and construction"
  }
}
```

## Historical Data Requirements

### Maintenance History (24 months)
- **Downtown Office**: 150+ maintenance records
  - HVAC system maintenance (monthly)
  - Elevator servicing (quarterly)
  - Electrical system checks (bi-monthly)
  - Plumbing repairs (as needed)
  - Security system updates (quarterly)

- **Suburban Complex**: 200+ maintenance records
  - Appliance repairs (frequent)
  - Landscaping maintenance (seasonal)
  - Common area cleaning (weekly)
  - Parking lot repairs (as needed)
  - Pool maintenance (seasonal)

- **Residential Condos**: 80+ maintenance records
  - Individual unit repairs (as needed)
  - Building envelope maintenance (annual)
  - Common area upkeep (monthly)
  - Security system maintenance (quarterly)

### Tenant Data (36 months)
- **Occupancy History**: Track move-ins/move-outs
- **Rent Payment History**: 95% on-time payment rate
- **Maintenance Requests**: Correlate with tenant satisfaction
- **Lease Terms**: Mix of 6-month, 12-month, and 24-month leases
- **Demographics**: Mix of individuals, couples, and families

### Financial Data (24 months)
- **Rent Rolls**: Monthly rent collection data
- **Expense Tracking**: Maintenance, utilities, insurance
- **Market Rate Analysis**: Local comparable rental rates
- **Occupancy Rates**: Historical occupancy percentages
- **Revenue Projections**: Based on current market conditions

## Data Setup Process

### Phase 1: Environment Preparation
1. **Backup Production Data**: Ensure staging is isolated
2. **Clean Staging Database**: Remove existing test data
3. **Verify Data Models**: Confirm all required tables exist
4. **Set Environment Variables**: Configure for test data generation

### Phase 2: Core Data Creation
1. **Create Properties**: Insert test property records
2. **Generate Users**: Create test user accounts with appropriate roles
3. **Populate Tenants**: Add tenant records with realistic demographics
4. **Insert Maintenance History**: Generate 24+ months of maintenance data
5. **Add Financial Data**: Create rent rolls and expense records

### Phase 3: AI Model Training Data
1. **Maintenance Patterns**: Ensure sufficient failure/success patterns
2. **Tenant Behavior**: Create realistic churn indicators
3. **Market Trends**: Generate historical market data
4. **Risk Factors**: Populate risk assessment data points

### Phase 4: Data Validation
1. **Completeness Check**: Verify all required data is present
2. **Consistency Validation**: Ensure data relationships are correct
3. **Privacy Compliance**: Confirm no real personal data is used
4. **Performance Testing**: Validate data load times and query performance

## Data Generation Scripts

### Automated Data Generation
```bash
# Run data generation scripts
npm run uat:data-setup

# Individual data generation
npm run uat:create-properties
npm run uat:create-users
npm run uat:generate-maintenance-history
npm run uat:populate-financial-data
```

### Manual Data Verification
```bash
# Verify data integrity
npm run uat:validate-data

# Check AI model readiness
npm run uat:verify-ai-models

# Performance validation
npm run uat:performance-check
```

## Data Privacy & Security

### Anonymization Requirements
- **Personal Information**: All names, emails, addresses are fictional
- **Financial Data**: Amounts are realistic but not from real transactions
- **Property Details**: Locations are generic, not specific addresses
- **Contact Information**: All phone numbers and emails are test-generated

### Access Controls
- **Test Environment Only**: Data exists only in staging environment
- **Role-Based Access**: Users can only access data appropriate to their role
- **Audit Logging**: All data access is logged for compliance
- **Cleanup Process**: Automated cleanup after UAT completion

## Data Scenarios for Testing

### Predictive Maintenance Scenarios
1. **Elevator Failure Prediction**: Historical data showing bearing wear patterns
2. **HVAC System Degradation**: Compressor efficiency decline over time
3. **Plumbing Leak Detection**: Pressure and moisture sensor data
4. **Electrical System Issues**: Circuit breaker failure patterns

### Churn Risk Scenarios
1. **High-Risk Tenant**: Multiple late payments, frequent complaints
2. **Medium-Risk Tenant**: Occasional late payments, lease ending soon
3. **Low-Risk Tenant**: Perfect payment history, long-term tenant
4. **False Positive**: Tenant appears at risk but has valid reasons

### Market Intelligence Scenarios
1. **Rising Market**: Increasing rental rates and occupancy
2. **Stable Market**: Consistent rates with normal fluctuations
3. **Declining Market**: Decreasing rates and occupancy challenges
4. **Competitive Market**: New competitors entering the area

## Post-UAT Data Cleanup

### Automated Cleanup
```bash
# Remove all test data
npm run uat:cleanup

# Reset to baseline state
npm run uat:reset-environment

# Verify cleanup completion
npm run uat:verify-cleanup
```

### Manual Verification
- Confirm all test users are removed
- Verify test properties are deleted
- Check that production data is unaffected
- Validate system returns to normal operation

## Success Criteria

### Data Completeness
- [ ] All required user accounts created
- [ ] Test properties populated with realistic data
- [ ] 24+ months of historical data generated
- [ ] AI models have sufficient training data

### Data Quality
- [ ] No duplicate or inconsistent records
- [ ] All data relationships are valid
- [ ] Privacy and security requirements met
- [ ] Performance benchmarks achieved

### Test Readiness
- [ ] All UAT scenarios have supporting data
- [ ] Edge cases are represented in the data
- [ ] Data load times meet performance requirements
- [ ] System stability confirmed with test data

---

**Document Version**: 1.0
**Created Date**: 2025-09-16
**Prepared By**: QA Team
**Approved By**: Data Privacy Officer