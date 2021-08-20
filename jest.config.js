module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/dist/*.{js,mjs}'],
  projects: ['<rootDir>/__tests__/cjs', '<rootDir>/__tests__/esm']
}
