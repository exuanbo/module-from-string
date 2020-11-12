import fs from 'fs'
import path from 'path'
import { requireFromString } from '../src/index'

it('should works with `module.exports`', () => {
  const res = requireFromString("module.exports = 'hello'")
  expect(res).toBe('hello')
})

it('should works with exports shortcut', () => {
  const res = requireFromString("exports.hello = 'hello'; exports.hi = 'hi'")
  expect(res.hello).toBe('hello')
  expect(res.hi).toBe('hi')
})

it('should work with relative require in file', function () {
  const code = fs.readFileSync(
    path.join(__dirname, 'fixtures/module.js'),
    'utf8'
  )
  const res = requireFromString(code, { process })
  expect(res).toBe('hello')
})
