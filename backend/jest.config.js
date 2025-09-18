module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.ts',
    '<rootDir>/src/**/?(*.)+(spec|test).ts',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
    },
  },
};
