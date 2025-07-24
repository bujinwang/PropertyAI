import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './types';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['propertyapp://', 'https://app.propertyai.com'],
  config: {
    screens: {
      PublicListing: 'public-listing/:listingId',
    },
  },
};

export default linking;