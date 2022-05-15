module.exports = {
  extends: ['./node_modules/ts-standardx/.eslintrc.js'],
  ignorePatterns: ['dist/**/*'],
  overrides: [
    {
      files: ['src/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
}
