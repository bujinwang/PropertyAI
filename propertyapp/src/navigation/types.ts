import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  // Auth Stack
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  
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
  
  // Legacy compatibility - keeping old property details route
  PropertyDetails: { propertyId: string };
};

// Navigation props for screens
export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: NativeStackNavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
};

// Type declaration for React Navigation to have proper typing
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// Screen-specific navigation prop types
export type RentalListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RentalList'>;
export type RentalDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RentalDetail'>;
export type RentalFormNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RentalForm'>;

// Legacy navigation prop types (for backward compatibility)
export type PropertyListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PropertyList'>;
export type PropertyDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PropertyDetail'>;
export type PropertyFormNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PropertyForm'>;
