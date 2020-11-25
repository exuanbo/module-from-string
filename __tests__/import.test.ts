import path from 'path'
import { importFromString } from '../src/import'

it('should work with named export', () => {
  const res = importFromString({ code: "export const salute = 'hi'" })
  expect(res.salute).toBe('hi')
})

it('should work with default export', () => {
  const res = importFromString({ code: "export default 'hi'" })
  expect(res.default).toBe('hi')
})

it('should work with relative require in file', () => {
  const modulePath = path.join(process.cwd(), '__tests__/fixtures/module.js')
  const res = importFromString({
    code: `import { default as salute } from '${modulePath}'\nexport { salute }`
  })
  expect(res.salute).toBe('hi')
})

it('should work with import external module', () => {
  const code = `import { transformSync } from 'esbuild'
export const { code } = transformSync('enum Salute { Hi }', { loader: 'ts' })
`
  const transformedCode = `var Salute;
(function(Salute2) {
  Salute2[Salute2["Hi"] = 0] = "Hi";
})(Salute || (Salute = {}));
`
  const res = importFromString({ code })
  expect(res.code).toBe(transformedCode)
})
