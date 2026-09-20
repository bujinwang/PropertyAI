/**
 * Global type augmentations for the custom Jest matchers registered at runtime in
 * `src/utils/test-utils.tsx` (`toHaveNoViolations` and `toMatchSelector`).
 *
 * These live in a dedicated `.d.ts` file because ambient namespace declarations are
 * only meaningful (and lint-clean) in definition files.
 */
declare namespace jest {
  interface Matchers<R> {
    toHaveNoViolations(): R;
    toMatchSelector(selector: string): R;
  }
}
