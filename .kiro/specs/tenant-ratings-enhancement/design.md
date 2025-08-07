# Design Document

## Overview

This design document outlines the technical approach for enhancing the tenant ratings page in the PropertyAI Dashboard. The enhancement will transform the current basic HTML interface into a modern, Material-UI based component with improved user experience, comprehensive rating capabilities, and proper data visualization.

The solution will leverage the existing Material-UI design system, maintain consistency with the current dashboard architecture, and extend the current tenant rating API to support multi-category ratings and enhanced functionality.

## Architecture

### Component Structure

```
TenantRatingPage/
├── components/
│   ├── TenantSelector/
│   │   ├── TenantAutocomplete.tsx
│   │   └── TenantCard.tsx
│   ├── RatingForm/
│   │   ├── CategoryRating.tsx
│   │   ├── StarRating.tsx
│   │   └── CommentEditor.tsx
│   ├── RatingDisplay/
│   │   ├── RatingCard.tsx
│   │   ├── RatingsList.tsx
│   │   └── RatingFilters.tsx
│   └── Analytics/
│       ├── RatingChart.tsx
│       ├── CategoryAverages.tsx
│       └── TrendAnalysis.tsx
├── hooks/
│   ├── useTenantRatings.ts
│   ├── useTenantSearch.ts
│   └── useRatingAnalytics.ts
├── types/
│   └── enhancedTenantRating.ts
└── TenantRatingPage.tsx
```

### State Management

The component will use React hooks for local state management:
- `useState` for form data, selected tenant, and UI states
- `useEffect` for data fetching and side effects
- Custom hooks for complex logic abstraction
- React Query (if available) or custom hooks for API state management

### Data Flow

1. **Tenant Selection**: User searches → API call → Filtered results → Selection updates state
2. **Rating Submission**: Form validation → API call → Success feedback → Data refresh
3. **Rating Display**: Tenant selection → Fetch ratings → Display with analytics
4. **Real-time Updates**: New ratings trigger state updates and re-renders

## Components and Interfaces

### Enhanced Tenant Rating Types

```typescript
interface EnhancedTenantRating extends TenantRating {
  categories: {
    cleanliness: number;
    communication: number;
    paymentHistory: number;
    propertyCare: number;
  };
  overallRating: number;
  tags?: string[];
  attachments?: string[];
}

interface TenantSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  property: {
    address: string;
    unit: string;
  };
  currentLease?: {
    id: string;
    startDate: string;
    endDate: string;
  };
}

interface RatingAnalytics {
  averageRatings: {
    overall: number;
    cleanliness: number;
    communication: number;
    paymentHistory: number;
    propertyCare: number;
  };
  ratingDistribution: {
    [key: number]: number;
  };
  trendData: {
    date: string;
    rating: number;
  }[];
}
```

### Core Components

#### TenantAutocomplete Component
```typescript
interface TenantAutocompleteProps {
  onTenantSelect: (tenant: TenantSearchResult) => void;
  selectedTenant: TenantSearchResult | null;
  disabled?: boolean;
}
```

Features:
- Material-UI Autocomplete with async search
- Debounced search input (300ms)
- Custom option rendering with tenant info
- Loading states and error handling

#### CategoryRating Component
```typescript
interface CategoryRatingProps {
  category: string;
  value: number;
  onChange: (category: string, value: number) => void;
  disabled?: boolean;
}
```

Features:
- Interactive star rating component
- Hover effects and visual feedback
- Keyboard accessibility
- Category-specific labels and descriptions

#### RatingCard Component
```typescript
interface RatingCardProps {
  rating: EnhancedTenantRating;
  showActions?: boolean;
  onEdit?: (rating: EnhancedTenantRating) => void;
  onDelete?: (ratingId: string) => void;
}
```

Features:
- Material-UI Card with elevation
- Category breakdown visualization
- Expandable comment section
- Action buttons for edit/delete

#### RatingChart Component
```typescript
interface RatingChartProps {
  data: RatingAnalytics;
  chartType: 'trend' | 'distribution' | 'categories';
  height?: number;
}
```

Features:
- Chart.js or Recharts integration
- Responsive design
- Interactive tooltips
- Export functionality

### Custom Hooks

#### useTenantRatings Hook
```typescript
interface UseTenantRatingsReturn {
  ratings: EnhancedTenantRating[];
  loading: boolean;
  error: string | null;
  createRating: (rating: CreateRatingRequest) => Promise<void>;
  updateRating: (id: string, rating: UpdateRatingRequest) => Promise<void>;
  deleteRating: (id: string) => Promise<void>;
  refetch: () => void;
}
```

#### useTenantSearch Hook
```typescript
interface UseTenantSearchReturn {
  searchTenants: (query: string) => Promise<TenantSearchResult[]>;
  loading: boolean;
  error: string | null;
}
```

## Data Models

### Database Schema Extensions

The existing tenant rating model will be extended to support multi-category ratings:

```sql
-- Extend existing tenant_ratings table
ALTER TABLE tenant_ratings ADD COLUMN categories JSONB;
ALTER TABLE tenant_ratings ADD COLUMN overall_rating DECIMAL(3,2);
ALTER TABLE tenant_ratings ADD COLUMN tags TEXT[];
ALTER TABLE tenant_ratings ADD COLUMN attachments TEXT[];

-- Create index for better query performance
CREATE INDEX idx_tenant_ratings_categories ON tenant_ratings USING GIN (categories);
CREATE INDEX idx_tenant_ratings_overall ON tenant_ratings (overall_rating);
```

### API Extensions

New endpoints will be added to support enhanced functionality:

```typescript
// GET /api/tenants/search?q={query}
interface TenantSearchResponse {
  tenants: TenantSearchResult[];
  total: number;
}

// GET /api/tenant-ratings/{tenantId}/analytics
interface RatingAnalyticsResponse {
  analytics: RatingAnalytics;
  lastUpdated: string;
}

// POST /api/tenant-ratings (enhanced)
interface CreateEnhancedRatingRequest {
  tenantId: string;
  leaseId: string;
  categories: {
    cleanliness: number;
    communication: number;
    paymentHistory: number;
    propertyCare: number;
  };
  comment?: string;
  tags?: string[];
  attachments?: string[];
}
```

## Error Handling

### Client-Side Error Handling

1. **Form Validation**:
   - Real-time validation with Material-UI form helpers
   - Custom validation rules for rating ranges
   - Required field indicators

2. **API Error Handling**:
   - Centralized error handling with custom hook
   - User-friendly error messages
   - Retry mechanisms for failed requests
   - Offline state detection

3. **Loading States**:
   - Skeleton screens for data loading
   - Button loading states during submissions
   - Progressive loading for large datasets

### Error Boundary Implementation

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class TenantRatingErrorBoundary extends Component<
  PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  // Error boundary implementation with fallback UI
}
```

## Testing Strategy

### Unit Testing

1. **Component Testing**:
   - React Testing Library for component behavior
   - Jest for utility functions and hooks
   - Mock API responses for isolated testing

2. **Hook Testing**:
   - Custom hook testing with `@testing-library/react-hooks`
   - API integration testing with MSW (Mock Service Worker)

### Integration Testing

1. **User Flow Testing**:
   - Complete rating submission flow
   - Tenant search and selection
   - Rating display and filtering

2. **API Integration**:
   - End-to-end API testing
   - Error scenario testing
   - Performance testing for large datasets

### Accessibility Testing

1. **WCAG Compliance**:
   - Keyboard navigation testing
   - Screen reader compatibility
   - Color contrast validation
   - Focus management

2. **Automated Testing**:
   - axe-core integration for automated a11y testing
   - Lighthouse accessibility audits

## Performance Considerations

### Optimization Strategies

1. **Code Splitting**:
   - Lazy loading for chart components
   - Dynamic imports for heavy dependencies

2. **Data Management**:
   - Pagination for large rating lists
   - Debounced search inputs
   - Memoization for expensive calculations

3. **Caching**:
   - React Query for API response caching
   - Local storage for user preferences
   - Service worker for offline functionality

### Bundle Size Management

1. **Tree Shaking**:
   - Import only necessary Material-UI components
   - Use lightweight chart libraries

2. **Asset Optimization**:
   - Image optimization for tenant avatars
   - Icon font vs SVG optimization

## Security Considerations

### Data Protection

1. **Input Validation**:
   - Client-side validation with server-side verification
   - XSS prevention in comment fields
   - File upload validation for attachments

2. **Authentication**:
   - JWT token validation
   - Role-based access control
   - Session management

### Privacy

1. **Data Handling**:
   - Sensitive data encryption
   - Audit logging for rating changes
   - GDPR compliance for data deletion

## Migration Strategy

### Backward Compatibility

1. **API Versioning**:
   - Maintain existing API endpoints
   - Gradual migration to enhanced endpoints
   - Feature flags for new functionality

2. **Data Migration**:
   - Script to migrate existing ratings to new schema
   - Default values for new category fields
   - Rollback procedures

### Deployment Plan

1. **Phased Rollout**:
   - Feature flags for gradual enablement
   - A/B testing for user experience validation
   - Monitoring and rollback procedures

2. **Performance Monitoring**:
   - Real User Monitoring (RUM)
   - API performance tracking
   - Error rate monitoring