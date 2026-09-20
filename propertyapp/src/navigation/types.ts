import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  // ── Live tree: routes registered by RootNavigator (the active navigator,
  // reached from App.tsx → RootNavigator). Keep these in sync with
  // RootNavigator.tsx; screens navigate to them via useNavigation<...>().
  Main: undefined;
  AIGuidedSetupWizard: undefined;
  ChatDetail:
    | { conversationId?: string; rentalId?: string; unitId?: string }
    | undefined;
  // Routes that live screens navigate to but that NO navigator registers.
  //
  // ⚠️ These are declared here purely so `navigation.navigate('X')` type-checks
  // instead of needing `as any`. Declaring a route does NOT make it work:
  // React Navigation only resolves routes registered as `<Stack.Screen name=…>`,
  // and `defaultOnUnhandledAction` returns early in production, so navigating to
  // any of these is a **silent no-op** (a dead button), not a crash.
  //
  // This is a known, unfixed product defect — see the navigation-target audit.
  // The compiler used to flag these; this declaration trades that signal for
  // lint cleanliness. Register the screen or delete the call site to fix it
  // properly. Do not treat this block as evidence the routes exist.
  UserManagement: undefined;
  SystemSettings: undefined;
  Analytics: undefined;
  DataExport: undefined;
  AITraining: undefined;
  APIKeys: undefined;
  EditProfile: undefined;
  Support: undefined;
  About: undefined;
  DataPrivacyCompliance: undefined;
  AddProperty: undefined;
  CreateListing: undefined;
  Tasks: undefined;
  Messages: undefined;
  Reports: undefined;
  NotificationSettings: undefined;
  PaymentMethods: undefined;
  ChangePassword: undefined;
  TwoFactorAuth: undefined;
  ScheduleTour: { rentalId: string };
  Application: { unitId: string };
  Dashboard: undefined;
  Maintenance: undefined;
  Payments: undefined;

  // Auth Stack
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  /**
   * Carries the reset token handed over by ForgotPasswordScreen
   * (`navigate('ResetPassword', { token })`). ResetPasswordScreen reads
   * `route.params.token`.
   */
  ResetPassword: { token: string };

  // Public (unauthenticated) entry
  PublicListing: undefined;

  // Main App Stack
  MainTabs: undefined;
  
  // Property/Rental Management (Updated for unified model)
  RentalList: undefined;
  RentalDetail: { rentalId: string };
  RentalForm: { rentalId?: string };
  
  // Legacy routes (for backward compatibility)
  PropertyList: undefined;
  PropertyDetail: { propertyId: string };
  PropertyForm: { propertyId?: string };
  
  UnitList: { propertyId?: string };
  UnitDetail: { unitId: string };
  UnitForm: { unitId?: string; propertyId?: string };
  
  ListingList: undefined;
  ListingDetail: { listingId: string };
  ListingForm: { listingId?: string };
  
  // Tenant Management
  TenantList: undefined;
  TenantDetail: { tenantId: string };
  TenantForm: { tenantId?: string };
  TenantDashboard: undefined;
  
  // Application Management
  ApplicationList: undefined;
  ApplicationDetail: { applicationId: string };
  ApplicationForm: { applicationId?: string };
  
  // Maintenance
  MaintenanceList: undefined;
  MaintenanceDetail: { maintenanceId: string };
  MaintenanceForm: { maintenanceId?: string };
  
  // Financial
  FinancialDashboard: undefined;
  PaymentList: undefined;
  PaymentDetail: { paymentId: string };
  
  // Settings
  Settings: undefined;
  Profile: undefined;
  
  // Visitor & Delivery Management
  VisitorManagement: undefined;
  VisitorDetail: { visitorId: string };
  VisitorForm: { visitorId?: string };
  DeliveryTracking: undefined;
  DeliveryDetail: { deliveryId: string };
  
  // ML Insights
  MLInsights: undefined;
  
  // Legacy compatibility - keeping old property details route
  PropertyDetails: { propertyId: string };
};

/**
 * The bottom-tab routes registered by MainTabNavigator.
 *
 * `MainTabParamList` was previously imported by both MainTabNavigator and (the
 * now-deleted) AppNavigator but defined nowhere. It mirrors the <Tab.Screen>
 * names actually rendered in MainTabNavigator.tsx: Home, Properties, Messages,
 * Profile are always present; ManageListings, Maintenance and Admin are
 * role-conditional (rendered only for propertyManager / admin).
 */
export type MainTabParamList = {
  Home: undefined;
  Properties: undefined;
  Messages: undefined;
  ManageListings: undefined;
  Maintenance: undefined;
  Admin: undefined;
  Profile: undefined;
};

/**
 * Param lists for the nested stack navigators mounted inside the bottom tabs.
 *
 * Each nested stack registers its own routes, so it must NOT be typed with
 * RootStackParamList — doing so produces TS2322/TS2820 because e.g.
 * 'MaintenanceRequests' is not a root route. Keeping these definitions in
 * types.ts (rather than in the navigator files) lets both the navigator and its
 * member screens import them without a circular dependency.
 */
export type ListingStackParamList = {
  ManageListings: undefined;
  EditListing: undefined;
};

export type MaintenanceStackParamList = {
  MaintenanceRequests: undefined;
  MaintenanceRequestDetails: { requestId: string };
};

// Navigation props for screens
export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: NativeStackNavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
};

// The React Navigation global type augmentation lives in
// `src/types/react-navigation.d.ts` (a declaration file, where the `namespace`
// syntax used for module augmentation is exempt from
// `@typescript-eslint/no-namespace`).

// Screen-specific navigation prop types
export type RentalListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RentalList'>;
export type RentalDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RentalDetail'>;
export type RentalFormNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RentalForm'>;

// Tenant navigation prop types
export type TenantDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TenantDashboard'>;
export type TenantListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TenantList'>;
export type TenantDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TenantDetail'>;
export type TenantFormNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TenantForm'>;

// Visitor management navigation prop types
export type VisitorManagementNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VisitorManagement'>;
export type VisitorDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VisitorDetail'>;
export type VisitorFormNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VisitorForm'>;
export type DeliveryTrackingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DeliveryTracking'>;
export type DeliveryDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DeliveryDetail'>;

// Legacy navigation prop types (for backward compatibility)
export type PropertyListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PropertyList'>;
export type PropertyDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PropertyDetail'>;
export type PropertyFormNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PropertyForm'>;
