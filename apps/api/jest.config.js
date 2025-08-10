/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts'
  ],

  // Coverage settings (disabled by default for performance)
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Mock and cleanup settings
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@repo/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^bullmq$': '<rootDir>/tests/__mocks__/bullmq.js'
  },

  // TypeScript configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }]
  },

  // Global setup and teardown - once for ALL tests
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',

  // Timeout settings (important for database operations)
  testTimeout: 10000,

  // Handle async operations properly - disabled since we manage connections globally
  detectOpenHandles: false,
  forceExit: true,

  // Verbose output for debugging (disabled for performance)
  verbose: false,

  // Run tests serially to avoid database connection issues (CRITICAL for DB tests)
  maxWorkers: 1,

  // Set up mocks for tests
  setupFilesAfterEnv: [
    '<rootDir>/tests/setupMocks.js'
  ],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
};