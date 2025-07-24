module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000,
  detectOpenHandles: true,
  forceExit: true,
  modulePaths: ['<rootDir>'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    'jstoxml': '<rootDir>/src/__mocks__/jstoxml.ts',
    '^../utils/cache': '<rootDir>/src/__mocks__/cache.ts'
  },
  transformIgnorePatterns: ['/node_modules/(?!jstoxml).+\\.js$'],
};
