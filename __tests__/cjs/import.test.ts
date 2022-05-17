import path from 'path'
import { importFromString, importFromStringSync } from '../../src/index'

let importFromStringFn: typeof importFromString | typeof importFromStringSync

const testImport = (): void => {
  it('should work with named export', async () => {
    const res = await importFromStringFn("export const greet = 'hi'")
    expect(res.greet).toBe('hi')
  })

  it('should work with default export', async () => {
    const res = await importFromStringFn("export default 'hi'")
    expect(res.default).toBe('hi')
  })

  it('should work with relative path import', async () => {
    const modulePath = './fixtures/namedExport.js'
    const res = await importFromStringFn(`export { greet } from '${modulePath}'`)
    expect(res.greet).toBe('hi')
  })

  it('should resolve correctly if option `dirname` is provided', async () => {
    const modulePath = './cjs/fixtures/defaultExport.js'
    const res = await importFromStringFn(`import greet from '${modulePath}';export default greet`, {
      dirname: path.dirname(__dirname)
    })
    expect(res.default).toBe('hi')
  })

  it('should work with absolute path import', async () => {
    const modulePath = path.join(__dirname, 'fixtures/namedExport.js')
    const res = await importFromStringFn(`export { greet } from '${modulePath}'`)
    expect(res.greet).toBe('hi')
  })

  it('should work with import external module', async () => {
    const code = `import { transformSync } from 'esbuild'
const { code } = transformSync('enum Greet { Hi }', { loader: 'ts' })
export default code
`
    const res = await importFromStringFn(code)
    expect(res.default).toMatchInlineSnapshot(`
      "var Greet = /* @__PURE__ */ ((Greet2) => {
        Greet2[Greet2[\\"Hi\\"] = 0] = \\"Hi\\";
        return Greet2;
      })(Greet || {});
      "
    `)
  })

  it('should work if transformOption is provided', async () => {
    const res = await importFromStringFn("export const greet: () => string = () => 'hi'", {
      transformOptions: { loader: 'ts' }
    })
    expect(res.greet()).toBe('hi')
  })
}

describe('importFromString', () => {
  importFromStringFn = importFromString
  testImport()
})

describe('importFromStringSync', () => {
  importFromStringFn = importFromStringSync
  testImport()
})
