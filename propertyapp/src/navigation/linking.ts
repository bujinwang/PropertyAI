import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './types';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['propertyapp://', 'https://app.propertyai.com'],
  config: {
    screens: {
      PublicListing: {
        path: 'public-listing/:listingId?',
        parse: {
          listingId: (listingId: string) => listingId === 'undefined' ? undefined : listingId,
        },
      },
    },
  },
};

export default linking;