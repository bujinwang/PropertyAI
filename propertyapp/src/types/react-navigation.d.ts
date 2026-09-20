import type { RootStackParamList } from '../navigation/types';

// Global type augmentation so `useNavigation()` (called without a generic) is
// aware of the application's route tree. This is the pattern recommended by
// React Navigation. It lives in a `.d.ts` file because module augmentation
// requires `namespace` syntax, which is only exempt from
// `@typescript-eslint/no-namespace` in declaration files.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
