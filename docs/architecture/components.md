# Components - PropertyAI Brownfield Architecture

**Document Version:** 1.0 (Brownfield)
**Last Updated:** 2025-09-14
**Purpose:** Document existing React components in the dashboard, patterns, and extensions for new features like reporting (21.4). Components are in `dashboard/src/components/` using MUI and React hooks.

## Overview

The frontend uses React with TypeScript, MUI for UI, and custom hooks for state management. Components follow atomic design principles: atoms, molecules, organisms, templates, pages. All components are responsive and accessible (ARIA labels, keyboard navigation).

## Core Component Patterns

### Atoms (Basic UI Elements)
- **Button:** Reusable MUI Button with custom variants (primary, secondary, destructive).
- **Input:** Form inputs with validation hooks.
- **Icon:** Custom icons using MUI Icon components.
- **Typography:** Consistent text styling with theme.

**Location:** `dashboard/src/components/atoms/`

### Molecules (Composed UI)
- **Card:** Reusable card with header, content, actions (used in dashboards).
- **FormField:** Input with label, validation, error display.
- **AlertBanner:** Notification alerts with severity levels.
- **ProgressBar:** Loading indicators for async operations.

**Location:** `dashboard/src/components/molecules/`

### Organisms (Complex Sections)
- **PropertyCard:** Property summary with metrics, status, actions.
- **TenantProfile:** Tenant details with contact, lease info, payment summary.
- **MaintenanceCard:** Maintenance request with status, priority, timeline.
- **PaymentHistory:** List of payments with filters, totals.
- **AnalyticsChart:** Reusable charts (line, bar, pie) with data props.

**Location:** `dashboard/src/components/organisms/`

### Templates (Page Layouts)
- **DashboardLayout:** Common layout with sidebar, header, main content.
- **FormTemplate:** Standard form layout with validation summary.
- **ListTemplate:** Paginated lists with search, filters, actions.

**Location:** `dashboard/src/components/templates/`

### Pages (Full Views)
- **PropertyDetail:** Detailed property view with tabs (overview, tenants, maintenance, market).
- **TenantDetail:** Tenant profile with lease, payments, communications.
- **Dashboard:** Role-based home with key metrics and recent activity.
- **Analytics:** Data visualization and reports.
- **Maintenance:** List and details of requests.

**Location:** `dashboard/src/pages/`

## Existing Component Library

### Dashboard Components (Key Ones)
- **PropertyManagerDashboard:** Main manager view with property metrics, alerts, recent activity.
  - Uses: AnalyticsChart, PropertyCard, AlertBanner
  - Props: userRole, properties, alerts

- **MaintenanceAlerts:** Alerts for upcoming maintenance based on predictions (from 21.1).
  - Uses: AlertBanner, Timeline
  - Props: predictions, properties

- **ChurnRiskAlerts:** Tenant churn warnings (from 21.2).
  - Uses: AlertBanner, TenantProfile
  - Props: highRiskTenants

- **MarketTrendsDashboard:** Market data visualization (from 21.3).
  - Uses: AnalyticsChart, TabPanel, Table
  - Props: zipCode, marketData, trends

- **PropertyDetail:** Multi-tab property view.
  - Tabs: Overview, Tenants, Maintenance, Financial, Market Intelligence (added 21.3)
  - Uses: TabPanel, PropertyCard, PaymentHistory

### Utility Components
- **AuthGuard:** Route protection with role checks.
- **DataLoader:** Suspense wrapper for async data fetching.
- **ErrorBoundary:** Global error handling with fallback UI.
- **ThemeProvider:** MUI theme configuration.

## Extensions for Reporting (21.4)

### New Components
- **ReportDashboard** (`dashboard/src/components/organisms/ReportDashboard.tsx`)
  - Purpose: Main reporting interface for template management, scheduling, viewing reports.
  - Composition: ListTemplate (for reports), FormTemplate (for creation), AnalyticsChart (for previews).
  - Props: userReports, templates, schedules.
  - Features: Drag-and-drop section builder, preview mode, export buttons.
  - Integration: Fetches from /reports and /reports/templates endpoints.

- **ReportPreview** (`dashboard/src/molecules/ReportPreview.tsx`)
  - Purpose: Live preview of report templates with sample data.
  - Composition: Typography for summaries, AnalyticsChart for visualizations, Alert for AI insights.
  - Props: templateData, previewMode.
  - Features: Dynamic rendering based on template sections, AI content simulation.

- **InsightGenerator** (`dashboard/src/organisms/InsightGenerator.tsx`)
  - Purpose: AI-powered insight display with confidence indicators.
  - Composition: Card with AI-generated text, Chip for confidence, Expandable for details.
  - Props: insights, confidenceScores.
  - Features: Highlighted recommendations, source attribution, audit links.

- **ReportScheduler** (`dashboard/src/molecules/ReportScheduler.tsx`)
  - Purpose: Configure report schedules and delivery.
  - Composition: FormField for frequency/recipients, DatePicker for dates, Button for save.
  - Props: scheduleData, onSave.
  - Features: Cron-like frequency selection, email template preview.

### Integration with Existing Components
- **Extend Analytics:** Add report metrics to AnalyticsChart for visualization support.
- **DashboardLayout:** Include reporting section in sidebar navigation.
- **PropertyDetail:** Add "Generate Report" action button linking to ReportDashboard.
- **ErrorBoundary:** Wrap AI generation to handle NLP failures gracefully.

### Component Guidelines for 21.4
- **AI Content:** All AI-generated elements must include confidence badges and source links.
- **Accessibility:** Reports support screen readers; export formats include alt text.
- **Performance:** Lazy-load report previews; cache template renders.
- **Responsive:** Mobile-friendly table views for report lists.

**Note:** This brownfield documentation reflects current component patterns. New reporting components (21.4) extend the atomic design while integrating with existing dashboard infrastructure.