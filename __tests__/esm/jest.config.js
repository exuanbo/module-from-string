import baseConfig from '../jest.config.base.js'

export default {
  ...baseConfig,
  coverageDirectory: '<rootDir>/coverage/esm',
  displayName: 'esm',
  globals: {
    'ts-jest': {
      isolatedModules: true,
      useESM: true
    }
  },
  preset: 'ts-jest/presets/default-esm',
  testMatch: ['<rootDir>/__tests__/esm/*.test.ts']
}
