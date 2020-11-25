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
