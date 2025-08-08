/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'api',
      testMatch: ['<rootDir>/apps/api/tests/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/apps/api/src/$1',
        '^@repo/shared/(.*)$': '<rootDir>/packages/shared/src/$1'
      },
      globalSetup: '<rootDir>/apps/api/tests/globalSetup.js',
      globalTeardown: '<rootDir>/apps/api/tests/globalTeardown.js',
      maxWorkers: 1,
      clearMocks: true,
      resetMocks: true,
      restoreMocks: true,
      testTimeout: 10000,
      detectOpenHandles: false,
      forceExit: true,
      verbose: true
    }
    // Add web tests project when needed
  ]
};