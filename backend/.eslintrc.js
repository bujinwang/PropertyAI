module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
  ],
  plugins: [
    '@typescript-eslint',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  rules: {
    // Basic TypeScript rules
    'no-unused-vars': 'off', // Turn off base rule
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-undef': 'off', // TypeScript handles this
    // The base rule cannot distinguish TypeScript overload signatures from a
    // genuinely duplicated class member, so it false-positives on legitimate
    // overloads (see `AuditService.logEvent`). Use the type-aware variant.
    'no-dupe-class-members': 'off',
    '@typescript-eslint/no-dupe-class-members': 'error',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '*.js',
  ],
};
