module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/*.ts'],
  coverageDirectory: '<rootDir>/coverage/cjs',
  displayName: 'cjs',
  preset: 'ts-jest',
  rootDir: '../..',
  testMatch: ['<rootDir>/__tests__/cjs/*.test.ts']
}
