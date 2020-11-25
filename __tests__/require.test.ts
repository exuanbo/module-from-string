import path from 'path'
import { requireFromString } from '../src/index'

it('should work with `module.exports`', () => {
  const res = requireFromString("module.exports = 'hi'")
  expect(res).toBe('hi')
})

it('should work with exports shortcut', () => {
  const res = requireFromString("exports.hello = 'hello'\nexports.hi = 'hi'")
  expect(res.hello).toBe('hello')
  expect(res.hi).toBe('hi')
})

it('should work with relative require in file', () => {
  const modulePath = path.join(process.cwd(), '__tests__/fixtures/module.js')
  const res = requireFromString(`module.exports = require('${modulePath}')`)
  expect(res).toBe('hi')
})

it('should have meaningful error message', () => {
  expect.assertions(1)
  try {
    requireFromString("throw new Error('Boom!')")
  } catch (err) {
    expect(
      err.stack.search(/module-from-string\/__tests__\/require\.test\.ts:24:5/)
    ).toBeGreaterThan(-1)
  }
})
