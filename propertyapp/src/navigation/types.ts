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
  
  // Main app screens
  Main: NavigatorScreenParams<MainTabParamList>;
  PropertyDetail: { propertyId: string };
  UnitDetail: { unitId: string };
  ChatDetail: { chatId: string; recipientName: string };
  Settings: undefined;
  MaintenanceRequests: undefined;
  MaintenanceRequestDetails: { requestId: string };
};