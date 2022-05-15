const baseConfig = require('../jest.config.base.js')

module.exports = {
  ...baseConfig,
  coverageDirectory: '<rootDir>/coverage/cjs',
  displayName: 'cjs',
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  preset: 'ts-jest',
  testMatch: ['<rootDir>/__tests__/cjs/*.test.ts']
}
