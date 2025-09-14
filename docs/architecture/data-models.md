# Data Models - PropertyAI Brownfield Architecture

**Document Version:** 1.0 (Brownfield)
**Last Updated:** 2025-09-14
**Purpose:** Document existing database models, relationships, and extensions for new features like AI reporting.

## Overview

This document captures the current Sequelize models in the PropertyAI application. Models are defined in `src/models/` using Sequelize ORM with PostgreSQL. All models include timestamps (createdAt, updatedAt) and soft deletes where appropriate.

## Core Models

### Property Model (`src/models/Property.js`)
**Purpose:** Represents real estate properties managed in the system.

**Fields:**
- id: UUID (Primary Key)
- address: STRING (Required - Full property address)
- city: STRING
- state: STRING (ENUM: 'CA', 'NY', 'TX', etc.)
- zipCode: STRING (Required)
- propertyType: ENUM ('single-family', 'multi-family', 'apartment', 'commercial')
- bedrooms: INTEGER
- bathrooms: DECIMAL(2,1)
- squareFootage: INTEGER
- monthlyRent: DECIMAL(10,2)
- securityDeposit: DECIMAL(10,2)
- leaseStartDate: DATE
- leaseEndDate: DATE
- ownerId: UUID (Foreign Key to User)
- managerId: UUID (Foreign Key to User)
- status: ENUM ('active', 'inactive', 'pending', 'under-maintenance')
- marketValue: DECIMAL(12,2) [Added in 21.3 for market metrics]
- marketTrend: ENUM ('increasing', 'decreasing', 'stable') [Added in 21.3]
- vacancyRate: DECIMAL(5,2) [Added in 21.3]

**Relationships:**
- HasMany: Units
- HasMany: Tenants (through Lease)
- HasMany: MaintenanceHistory
- BelongsTo: Owner (User)
- BelongsTo: Manager (User)

**Extensions for Reporting (21.4):**
- Add reportMetrics: JSONB - Store aggregated report data (e.g., {"monthlyIncome": 5000, "occupancyRate": 95})
- Add lastReportGenerated: DATE - Track most recent report generation

### User Model (`src/models/User.js`)
**Purpose:** Represents users (owners, managers, tenants, contractors).

**Fields:**
- id: UUID (Primary Key)
- email: STRING (Unique, Required)
- password: STRING (Hashed)
- firstName: STRING
- lastName: STRING
- role: ENUM ('owner', 'manager', 'tenant', 'contractor', 'admin')
- phone: STRING
- isActive: BOOLEAN (Default: true)
- emailVerified: BOOLEAN (Default: false)
- lastLogin: DATE

**Relationships:**
- HasMany: Properties (as owner/manager)
- HasMany: Leases (as tenant)
- HasMany: MaintenanceRequests (as contractor)
- BelongsToMany: Properties (through Lease for tenants)

**Extensions for Reporting (21.4):**
- Add reportPreferences: JSONB - User-specific report settings (e.g., {"format": "pdf", "frequency": "monthly"})

### Lease Model (`src/models/Lease.js`)
**Purpose:** Represents rental agreements between properties and tenants.

**Fields:**
- id: UUID (Primary Key)
- propertyId: UUID (Foreign Key)
- tenantId: UUID (Foreign Key)
- startDate: DATE (Required)
- endDate: DATE
- monthlyRent: DECIMAL(10,2) (Required)
- securityDeposit: DECIMAL(10,2)
- leaseType: ENUM ('month-to-month', 'fixed-term')
- status: ENUM ('active', 'pending', 'expired', 'terminated')
- renewalOption: BOOLEAN

**Relationships:**
- BelongsTo: Property
- BelongsTo: Tenant (User)
- HasMany: Payments
- HasMany: MaintenanceRequests

**Extensions for Reporting (21.4):**
- Add churnRiskScore: DECIMAL(3,2) [From 21.2 integration]
- Add predictedEndDate: DATE - AI-predicted lease end based on churn model

### Payment Model (`src/models/Payment.js`)
**Purpose:** Tracks rent payments and fees.

**Fields:**
- id: UUID (Primary Key)
- leaseId: UUID (Foreign Key)
- amount: DECIMAL(10,2) (Required)
- paymentDate: DATE
- dueDate: DATE (Required)
- paymentMethod: ENUM ('ach', 'credit-card', 'check', 'cash')
- status: ENUM ('pending', 'paid', 'late', 'failed')
- lateFee: DECIMAL(10,2)
- stripeChargeId: STRING (For card payments)

**Relationships:**
- BelongsTo: Lease
- BelongsTo: PaymentMethod (if separate model)

**Extensions for Reporting (21.4):**
- Add predictedPaymentRisk: DECIMAL(3,2) - AI score for payment reliability

### MaintenanceHistory Model (`src/models/MaintenanceHistory.js`)
**Purpose:** Tracks maintenance requests and history.

**Fields:**
- id: UUID (Primary Key)
- propertyId: UUID (Foreign Key)
- unitId: UUID (Foreign Key, optional)
- tenantId: UUID (Foreign Key, optional)
- contractorId: UUID (Foreign Key, optional)
- description: TEXT (Required)
- status: ENUM ('pending', 'in-progress', 'completed', 'cancelled')
- priority: ENUM ('low', 'medium', 'high', 'emergency')
- estimatedCost: DECIMAL(10,2)
- actualCost: DECIMAL(10,2)
- createdAt: DATE
- completedAt: DATE
- predictedNextMaintenance: DATE [Added in 21.1 for predictive]

**Relationships:**
- BelongsTo: Property
- BelongsTo: Unit
- BelongsTo: Tenant (User)
- BelongsTo: Contractor (User)

**Extensions for Reporting (21.4):**
- Add maintenancePredictiveScore: DECIMAL(3,2) [From 21.1 integration]

## New Models for Reporting (21.4)

### ReportTemplate (`src/models/ReportTemplate.js`)
**Purpose:** Customizable report configurations.

**Fields:**
- id: UUID (Primary Key)
- name: STRING (Required - e.g., "Monthly Financial Summary")
- ownerId: UUID (Foreign Key to User)
- sections: JSONB (Array of section configurations: type, dataSource, visualization)
- schedule: JSONB (Frequency, recipients, format)
- isActive: BOOLEAN (Default: true)
- version: INTEGER (For template versioning)
- createdAt: DATE

**Relationships:**
- BelongsTo: Owner (User)
- HasMany: GeneratedReports

### GeneratedReport (`src/models/GeneratedReport.js`)
**Purpose:** Instance of generated reports for storage and access.

**Fields:**
- id: UUID (Primary Key)
- templateId: UUID (Foreign Key)
- reportDate: DATE (Generation date)
- periodStart: DATE
- periodEnd: DATE
- content: JSONB (Generated report data and AI insights)
- status: ENUM ('draft', 'generated', 'sent', 'archived')
- aiConfidence: DECIMAL(3,2) (Average confidence of AI-generated content)
- recipientId: UUID (Foreign Key, optional)
- filePath: STRING (For exported files)
- generatedAt: DATE

**Relationships:**
- BelongsTo: ReportTemplate
- BelongsTo: Recipient (User, optional)

## Data Relationships for Reporting

### Report Generation Flow
1. **Input Data Sources:**
   - Property metrics (occupancy, revenue, expenses)
   - Tenant data (churn risk, payment history)
   - Market trends (from 21.3 service)
   - Maintenance predictions (from 21.1)
   - Financial data (payments, invoices)

2. **AI Processing:**
   - Aggregate data across sources
   - Generate insights using predefined rules and ML models
   - Create natural language summaries
   - Score recommendations by impact and feasibility

3. **Output Generation:**
   - Apply template structure
   - Render visualizations (charts, tables)
   - Export to specified formats
   - Store audit trail

### Key Relationships Diagram
```
Property → Units → Leases → Tenants (Users)
  ↓           ↓         ↓
Maintenance  Payments  Churn Risk
  ↓           ↓         ↓
Predictions  Invoices  Reports
  ↓           ↓         ↓
  → Reporting Engine ← Market Data (21.3)
```

## Data Validation and Constraints

- **Data Freshness:** Reports use data no older than 24 hours
- **AI Confidence Threshold:** Recommendations below 70% confidence flagged for review
- **Privacy Compliance:** PII redacted in automated reports; tenant consent required
- **Audit Retention:** All generated reports retained for 7 years per compliance

## Integration Points

- **Existing Analytics:** Extend analyticsService.js for report data aggregation
- **Notification Service:** Use for scheduled report delivery
- **File Storage:** Integrate with existing upload service for exported reports
- **Auth System:** Reports respect user roles and access permissions

**Note:** This brownfield documentation reflects current implementation patterns. Extensions for 21.4 maintain consistency with existing models while adding necessary reporting capabilities.