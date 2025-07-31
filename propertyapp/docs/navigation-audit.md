# PropertyApp Navigation Audit & Standardization Plan

## Current State Analysis

### Inconsistencies Found
1. **Screen Naming Duplication**
   - `PropertyDetailScreen` vs `PropertyDetailsScreen` (lines 12 vs 28 in AppNavigator.tsx)
   - `PropertyDetail` route vs `PropertyDetails` route

2. **Missing Navigation Flows**
   - `PropertyList` referenced but not implemented
   - `AddProperty` referenced but not implemented
   - `ChatDetail` used in PropertyDetailScreen but not in navigation types
   - `ScheduleTour` referenced but not defined

3. **Route Parameter Inconsistencies**
   - Some routes use `propertyId` others may use `id`
   - No consistent parameter naming convention

## Standardized Navigation Schema

### Route Naming Convention
```typescript
// Format: [Feature][Action]Screen
// Examples:
// - PropertyListScreen (list view)
// - PropertyDetailScreen (detail view)
// - PropertyCreateScreen (create new)
// - PropertyEditScreen (edit existing)
```

### Updated Navigation Structure

#### Root Stack Navigator
```typescript
type RootStackParamList = {
  // Auth Flow
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  MFASetup: undefined;
  
  // Main App
  MainTabs: undefined;
  
  // Property Management
  PropertyList: { filter?: PropertyFilter };
  PropertyDetail: { propertyId: string };
  PropertyCreate: undefined;
  PropertyEdit: { propertyId: string };
  PropertyPhotos: { propertyId: string };
  
  // Maintenance
  MaintenanceList: { propertyId?: string };
  MaintenanceDetail: { requestId: string };
  MaintenanceCreate: { propertyId?: string };
  
  // Communication
  ConversationList: undefined;
  ConversationDetail: { conversationId: string };
  
  // Scheduling
  TourSchedule: { propertyId: string };
  
  // AI Features
  AIGuidedSetup: undefined;
  AIRecommendations: undefined;
  
  // Settings & Compliance
  Settings: undefined;
  PrivacyCenter: undefined;
};
```

#### Tab Navigator Structure
```typescript
type MainTabParamList = {
  Dashboard: undefined;
  Properties: undefined;
  Maintenance: undefined;
  Messages: undefined;
  Profile: undefined;
};
```

## Implementation Steps

### Week 1: Foundation Fixes
1. **Rename Duplicate Screens**
   - Remove `PropertyDetailsScreen` (keep `PropertyDetailScreen`)
   - Update all references consistently

2. **Add Missing Screens**
   - Create `PropertyListScreen` (replaces PropertiesScreen)
   - Create `PropertyCreateScreen` (replaces PropertyFormScreen)
   - Create `TourScheduleScreen`

3. **Standardize Parameters**
   - All entity routes use `{ entityId: string }`
   - All list routes use `{ filter?: FilterType }`

### Deep Linking Structure
```typescript
// propertyapp://properties - Property list
// propertyapp://properties/:id - Property detail
// propertyapp://properties/:id/schedule-tour - Tour scheduling
// propertyapp://maintenance/:id - Maintenance detail
// propertyapp://conversations/:id - Message thread
```

## Navigation Guards & Permissions
```typescript
const navigationGuards = {
  requireAuth: ['PropertyCreate', 'MaintenanceCreate'],
  requireRole: {
    admin: ['PropertyCreate', 'PropertyEdit'],
    tenant: ['MaintenanceCreate'],
    property_manager: ['PropertyCreate', 'PropertyEdit']
  }
};
```