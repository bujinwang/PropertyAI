import { NavigatorScreenParams } from '@react-navigation/native';

// Tab navigation params
export type MainTabParamList = {
  Home: undefined;
  Properties: undefined;
  Messages: undefined;
  Profile: undefined;
  // Role-specific tabs
  ManageListings: undefined;
  Maintenance: undefined;
  Admin: undefined;
};

// Stack navigation params
export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  
  // Onboarding
  AIGuidedSetupWizard: undefined;
  
  // Main app screens
  Main: NavigatorScreenParams<MainTabParamList>;
  PropertyDetail: { propertyId: string };
  PropertyForm: { propertyId?: string };
  UnitDetail: { unitId: string };
  ChatDetail: { chatId: string; recipientName: string };
  Settings: undefined;
  MaintenanceRequests: undefined;
  MaintenanceRequestDetails: { requestId: string };
  ManageListings: undefined;
  EditListing: { listingId?: string };
  
  // Additional screens for RBAC implementation
  PropertyList: undefined;
  AddProperty: undefined;
  AdminDashboard: undefined;
  UserManagement: undefined;
  MaintenanceRequest: undefined;
  Payments: undefined;
  AIRecommendations: undefined;
};
