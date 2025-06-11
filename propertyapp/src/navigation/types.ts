import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PortfolioSize } from '../services/setupWizardService';
import { UserRole } from '../types/user';
import { NavigatorScreenParams } from '@react-navigation/native';

// Main tab navigator param list
export type MainTabParamList = {
  Home: undefined;
  Properties: undefined;
  Maintenance: undefined;
  Messages: undefined;
  Profile: undefined;
};

// Add AIGuidedSetupWizardScreen to RootStackParamList
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  PropertyForm: { propertyId?: string };
  PropertyDetail: { propertyId: string };
  MaintenanceRequestForm: { propertyId?: string; unitId?: string };
  MaintenanceRequestDetail: { requestId: string };
  PropertyPhotos: { propertyId: string };
  PhotoManagement: { propertyId: string };
  Chat: { conversationId: string };
  AIGuidedSetupWizard: {
    isFirstLogin?: boolean;
    role?: UserRole;
    portfolioSize?: PortfolioSize;
  };
  DataPrivacyCompliance: undefined;
  SecuritySettings: undefined;
};

// Navigation props for screens
export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: NativeStackNavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
};

// Type declaration for React Navigation to have proper typing
export {};
declare global {
  // Extend React Navigation to use our RootStackParamList types
  export namespace ReactNavigation {
    export interface RootParamList extends RootStackParamList {}
  }
}
