import path from 'path'
import { fileURLToPath } from 'url'
import { importFromString, importFromStringSync } from '../../src/index'

const dirname = path.dirname(fileURLToPath(new URL(import.meta.url)))

describe('importFromString', () => {
  it('should work with named export', async () => {
    const res = await importFromString("export const greet = 'hi'")
    expect(res.greet).toBe('hi')
  })

  it('should work with default export', async () => {
    const res = await importFromString("export default 'hi'")
    expect(res.default).toBe('hi')
  })

  it('should work with relative path import', async () => {
    const modulePath = './fixtures/namedExport.js'
    const res = await importFromString(`export { greet } from '${modulePath}'`)
    expect(res.greet).toBe('hi')
  })

  it('should resolve correctly if option `dirPath` is provided', async () => {
    const modulePath = './esm/fixtures/defaultExport.js'
    const res = await importFromString(`export { default } from '${modulePath}'`, {
      dirname: path.dirname(dirname)
    })
    expect(res.default).toBe('hi')
  })

  it('should work with absolute path import', async () => {
    const modulePath = path.join(dirname, 'fixtures/namedExport.js')
    const res = await importFromString(`export { greet } from '${modulePath}'`)
    expect(res.greet).toBe('hi')
  })

  it('should work with import external module', async () => {
    const code = `import { transformSync } from 'esbuild'
const { code } = transformSync('enum Greet { Hi }', { loader: 'ts' })
export default code
`
    const res = await importFromString(code)
    expect(res.default).toMatchInlineSnapshot(`
      "var Greet = /* @__PURE__ */ ((Greet2) => {
        Greet2[Greet2[\\"Hi\\"] = 0] = \\"Hi\\";
        return Greet2;
      })(Greet || {});
      "
    `)
  })

  it('should be able to use dynamic import', async () => {
    const modulePath = './fixtures/namedExport.js'
    const res = await importFromString(`export const greetModule = import('${modulePath}')`)
    expect((await res.greetModule).greet).toBe('hi')
  })

  it('should work if transformOption is provided', async () => {
    const res = await importFromString("export default function(): string { return 'hi' }", {
      transformOptions: { loader: 'ts' }
    })
    expect(res.default()).toBe('hi')
  })

  it('should be able to access import.meta.url', async () => {
    const res = await importFromString('export const { url } = import.meta')
    expect(res.url).toMatch(dirname)
  })
})

describe('importFromStringSync', () => {
  it('should throw error if import ES module', () => {
    const modulePath = './fixtures/defaultExport.js'
    expect(() => {
      importFromStringSync(`export { default } from '${modulePath}'`)
    }).toThrowError(
      `'import' statement of ES modules is not supported
Use asynchronous function 'importFromString' instead or replace it with dynamic 'import()' expression.`
    )
  })
})
