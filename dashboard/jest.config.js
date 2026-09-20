module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  setupFiles: [
    // Provides `globalThis.__VITE_ENV__` before anything imports a module that
    // reads `import.meta.env` at module scope. Must stay ahead of the others.
    '<rootDir>/jest/viteEnv.setup.js',
    '<rootDir>/src/setupCanvas.ts',
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^lodash-es$': 'lodash',
  },
  transform: {
    // ts-jest with Vite's `import.meta.env` rewritten for CommonJS — see the
    // transformer's header comment for why the stock `ts-jest` entry fails.
    '^.+\\.(ts|tsx)$': '<rootDir>/jest/viteImportMetaEnvTransformer.js',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(lodash-es)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/?(*.)(spec|test).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
  ],
};