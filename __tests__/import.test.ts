import path from 'path'
import { importFromString, importFromStringSync } from '../src/index'

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
    const res = await importFromString(
      `export { default as greet } from '${modulePath}'`
    )
    expect(res.greet).toBe('hi')
  })

  it('should work with absolute path import', async () => {
    const modulePath = path.join(__dirname, 'fixtures/module.js')
    const res = await importFromString(
      `export { default as greet } from '${modulePath}'`
    )
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
    const res = await importFromString(
      "export const greet: () => string = () => 'hi'",
      { transformOptions: { loader: 'ts' } }
    )
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
    const modulePath = './fixtures/module.js'
    const res = importFromStringSync(
      `export { default as greet } from '${modulePath}'`
    )
    expect(res.greet).toBe('hi')
  })

  it('should work with absolute path import', () => {
    const modulePath = path.join(__dirname, 'fixtures/module.js')
    const res = importFromStringSync(
      `export { default as greet } from '${modulePath}'`
    )
    expect(res.greet).toBe('hi')
  })

  it('should work with import external module', () => {
    const code = `import { transformSync } from 'esbuild'
export const { code } = transformSync('enum Greet { Hi }', { loader: 'ts' })
`
    const transformedCode = `var Greet;
(function(Greet2) {
  Greet2[Greet2["Hi"] = 0] = "Hi";
})(Greet || (Greet = {}));
`
    const res = importFromStringSync(code)
    expect(res.code).toBe(transformedCode)
  })

  it('should work if transformOption is provided', async () => {
    const res = await importFromStringSync(
      "export const greet: () => string = () => 'hi'",
      { transformOptions: { loader: 'ts' } }
    )
    expect(res.greet()).toBe('hi')
  })
})
