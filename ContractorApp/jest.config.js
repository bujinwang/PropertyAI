/**
 * Jest configuration for the ContractorApp (Expo / React Native).
 *
 * The `jest-expo` preset matches the Expo SDK used by this app (SDK 52) and
 * wires up the React Native Babel transform, the Expo native-module mocks and
 * the correct `transformIgnorePatterns` so that Expo/React Native packages are
 * transpiled instead of being skipped as plain `node_modules` code.
 */
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Coverage should reflect the real application source, not config/mocks.
  collectCoverageFrom: [
    'App.tsx',
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  // Keep the suite deterministic in CI.
  clearMocks: true,
};
