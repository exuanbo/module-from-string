export default {
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/*.ts'],
  coverageDirectory: '<rootDir>/coverage/esm',
  displayName: 'esm',
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  preset: 'ts-jest/presets/default-esm',
  rootDir: '../..',
  testMatch: ['<rootDir>/__tests__/esm/*.test.ts']
}
