import path from 'path'
import { requireFromString } from '../src/index'

it('should work with `module.exports`', () => {
  const res = requireFromString({ code: "module.exports = 'hi'" })
  expect(res).toBe('hi')
})

it('should work with exports shortcut', () => {
  const res = requireFromString({
    code: "exports.hello = 'hello'\nexports.hi = 'hi'"
  })
  expect(res.hello).toBe('hello')
  expect(res.hi).toBe('hi')
})

it('should work with relative require in file', () => {
  const modulePath = path.join(process.cwd(), '__tests__/fixtures/module.js')
  const res = requireFromString({
    code: `module.exports = require('${modulePath}')`
  })
  expect(res).toBe('hi')
})

it('should work with provided globals', () => {
  const res = requireFromString({
    code: 'module.exports = process.cwd()',
    globals: { process }
  })
  expect(res).toBe(process.cwd())
})

it('should work with require external module', () => {
  const code = `const { transformSync } = require('esbuild')
const { code } = transformSync('enum Greet { Hi }', { loader: 'ts' })
module.exports = code
`
  const transformedCode = `var Greet;
(function(Greet2) {
  Greet2[Greet2["Hi"] = 0] = "Hi";
})(Greet || (Greet = {}));
`
  const res = requireFromString({ code })
  expect(res).toBe(transformedCode)
})

it('should have meaningful error message', () => {
  expect.assertions(1)
  try {
    requireFromString({ code: "throw new Error('Boom!')" })
  } catch (err) {
    expect(
      err.stack.search(/module-from-string\/__tests__\/require\.test\.ts:50:5/)
    ).toBeGreaterThan(0)
  }
})
