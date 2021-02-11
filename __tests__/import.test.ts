import path from 'path'
import { importFromString, importFromStringSync } from '../src/index'

describe('importFromString', () => {
  it('should work with named export', async () => {
    const res = await importFromString("export const salute = 'hi'")
    expect(res.salute).toBe('hi')
  })

  it('should work with default export', async () => {
    const res = await importFromString("export default 'hi'")
    expect(res.default).toBe('hi')
  })

  it('should work with relative require in file', async () => {
    const modulePath = path.join(process.cwd(), '__tests__/fixtures/module.js')
    const res = await importFromString(
      `import { default as salute } from '${modulePath}'\nexport { salute }`
    )
    expect(res.salute).toBe('hi')
  })

  it('should work with import external module', async () => {
    const code = `import { transformSync } from 'esbuild'
export const { code } = transformSync('enum Salute { Hi }', { loader: 'ts' })
`
    const transformedCode = `var Salute;
(function(Salute2) {
  Salute2[Salute2["Hi"] = 0] = "Hi";
})(Salute || (Salute = {}));
`
    const res = await importFromString(code)
    expect(res.code).toBe(transformedCode)
  })

  it('should work if transformOption is provided', async () => {
    const res = await importFromString({
      code: "export const salute: () => string = () => 'hi'",
      transformOptions: { loader: 'ts' }
    })
    expect(res.salute()).toBe('hi')
  })
})

describe('importFromStringSync', () => {
  it('should work with named export', () => {
    const res = importFromStringSync("export const salute = 'hi'")
    expect(res.salute).toBe('hi')
  })

  it('should work with default export', () => {
    const res = importFromStringSync("export default 'hi'")
    expect(res.default).toBe('hi')
  })

  it('should work with relative require in file', () => {
    const modulePath = path.join(process.cwd(), '__tests__/fixtures/module.js')
    const res = importFromStringSync(
      `import { default as salute } from '${modulePath}'\nexport { salute }`
    )
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
    const res = importFromStringSync(code)
    expect(res.code).toBe(transformedCode)
  })

  it('should work if transformOption is provided', async () => {
    const res = await importFromStringSync({
      code: "export const salute: () => string = () => 'hi'",
      transformOptions: { loader: 'ts' }
    })
    expect(res.salute()).toBe('hi')
  })
})
