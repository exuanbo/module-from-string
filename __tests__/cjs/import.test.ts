import path from 'path'
import { importFromString, importFromStringSync } from '../../src/index'

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

  it('should resolve correctly if option `dirname` is provided', async () => {
    const modulePath = './cjs/fixtures/defaultExport.js'
    const res = await importFromString(`import greet from '${modulePath}'; export default greet`, {
      dirname: path.dirname(__dirname)
    })
    expect(res.default).toBe('hi')
  })

  it('should work with absolute path import', async () => {
    const modulePath = path.join(__dirname, 'fixtures/namedExport.js')
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

  it('should work if transformOption is provided', async () => {
    const res = await importFromString("export const greet: () => string = () => 'hi'", {
      transformOptions: { loader: 'ts' }
    })
    expect(res.greet()).toBe('hi')
  })
})

describe('importFromStringSync', () => {
  it('should work with named export', () => {
    const res = importFromStringSync("export const greet = 'hi'")
    expect(res.greet).toBe('hi')
  })

  it('should work with default export', () => {
    const res = importFromStringSync("export default 'hi'")
    expect(res.default).toBe('hi')
  })

  it('should work with relative path import', () => {
    const modulePath = './fixtures/namedExport.js'
    const res = importFromStringSync(`export { greet } from '${modulePath}'`)
    expect(res.greet).toBe('hi')
  })

  it('should resolve correctly if option `dirname` is provided', () => {
    const modulePath = './cjs/fixtures/defaultExport.js'
    const res = importFromStringSync(`import greet from '${modulePath}'; export default greet`, {
      dirname: path.dirname(__dirname)
    })
    expect(res.default).toBe('hi')
  })

  it('should work with absolute path import', () => {
    const modulePath = path.join(__dirname, 'fixtures/namedExport.js')
    const res = importFromStringSync(`export { greet } from '${modulePath}'`)
    expect(res.greet).toBe('hi')
  })

  it('should work with import external module', () => {
    const code = `import { transformSync } from 'esbuild'
const { code } = transformSync('enum Greet { Hi }', { loader: 'ts' })
export default code
`
    const res = importFromStringSync(code)
    expect(res.default).toMatchInlineSnapshot(`
      "var Greet = /* @__PURE__ */ ((Greet2) => {
        Greet2[Greet2[\\"Hi\\"] = 0] = \\"Hi\\";
        return Greet2;
      })(Greet || {});
      "
    `)
  })

  it('should work if transformOption is provided', () => {
    const res = importFromStringSync("export const greet: () => string = () => 'hi'", {
      transformOptions: { loader: 'ts' }
    })
    expect(res.greet()).toBe('hi')
  })
})
