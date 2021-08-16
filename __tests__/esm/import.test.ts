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
    const modulePath = './fixtures/module.js'
    const res = await importFromString(`export { default as greet } from '${modulePath}'`)
    expect(res.greet).toBe('hi')
  })

  it('should resolve correctly if option `dirPath` is provided', async () => {
    const modulePath = './esm/fixtures/module.js'
    const res = await importFromString(`export { default as greet } from '${modulePath}'`, {
      dirname: path.join(dirname, '..')
    })
    expect(res.greet).toBe('hi')
  })

  it('should work with absolute path import', async () => {
    const modulePath = path.join(dirname, 'fixtures/module.js')
    const res = await importFromString(`export { default as greet } from '${modulePath}'`)
    expect(res.greet).toBe('hi')
  })

  it('should work with import external module', async () => {
    const code = `import { transformSync } from 'esbuild'
export const { code } = transformSync('enum Greet { Hi }', { loader: 'ts' })
`
    const transformedCode = `var Greet;
(function(Greet2) {
  Greet2[Greet2["Hi"] = 0] = "Hi";
})(Greet || (Greet = {}));
`
    const res = await importFromString(code)
    expect(res.code).toBe(transformedCode)
  })

  it('should work if transformOption is provided', async () => {
    const res = await importFromString("export const greet: () => string = () => 'hi'", {
      transformOptions: { loader: 'ts' }
    })
    expect(res.greet()).toBe('hi')
  })

  it('should be able to access import.meta.url', async () => {
    const res = await importFromString('export default import.meta.url')
    expect(res.default).toMatch(dirname)
  })
})

describe('importFromStringSync', () => {
  it('should throw error', () => {
    expect(() => {
      importFromStringSync("export const greet = 'hi'")
    }).toThrowError(
      `function \`importFromStringSync\` can not work in ES module scope
Use asynchronous function \`importFromString\` instead and execute node with \`--experimental-vm-modules\` command flag.`
    )
  })
})
