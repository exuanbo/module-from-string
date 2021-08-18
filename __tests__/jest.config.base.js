const path = require('path')

module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/*.ts'],
  rootDir: path.dirname(__dirname)
}
