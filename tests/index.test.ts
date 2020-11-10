import { requireFromString } from '../src/index'

it('should works with `module.exports`', () => {
  const res = requireFromString("module.exports = 'hello'")
  expect(res).toBe('hello')
})

it('should works with `module.exports.default`', () => {
  const res = requireFromString("module.exports.default = 'hello'")
  expect(res).toBe('hello')
})

it('should works with exports shortcut', () => {
  const res = requireFromString("exports.default = 'hello'")
  expect(res).toBe('hello')
})
