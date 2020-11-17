import fs from 'fs'
import path from 'path'
import { requireFromString } from '../src/index'

it('should throw error if argument is not string', () => {
  expect.assertions(1)
  try {
    // @ts-expect-error
    requireFromString(module)
  } catch (err) {
    expect(err.message).toBe("Argument must be string, not 'object'.")
  }
})

it('should work with `module.exports`', () => {
  const res = requireFromString("module.exports = 'hello'")
  expect(res).toBe('hello')
})

it('should work with exports shortcut', () => {
  const res = requireFromString("exports.hello = 'hello'; exports.hi = 'hi'")
  expect(res.hello).toBe('hello')
  expect(res.hi).toBe('hi')
})

it('should work with nested require', () => {
  const code = fs.readFileSync(
    path.join(process.cwd(), 'test/fixtures/module.js'),
    'utf8'
  )
  const res = requireFromString(code, { process })
  expect(res).toBe('hello')
})
