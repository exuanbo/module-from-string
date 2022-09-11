import os from 'os'
import path from 'path'
import normalizePath from 'normalize-path'
import { fileURLToPath, pathToFileURL } from 'url'
import { importFromString, createImportFromString, importFromStringSync } from '../../src/index'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
    const modulePath = './esm/fixtures/defaultExport.js'
    const res = await importFromString(`export { default } from '${modulePath}'`, {
      dirname: path.dirname(__dirname)
    })
    expect(res.default).toBe('hi')
  })

  it('should work with absolute path import', async () => {
    const modulePath = path.join(__dirname, 'fixtures/namedExport.js')
    const res = await importFromString(`export { greet } from ${JSON.stringify(modulePath)}`)
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
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const importModule = async (modulePath: string): Promise<any> => {
      const result = await importFromString(
        `export const module = import(${JSON.stringify(modulePath)})`
      )
      return result.module
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const modulePath = './fixtures/namedExport.js'
    expect((await importModule(modulePath)).greet).toBe('hi')

    const absoluteModulePath = path.join(__dirname, modulePath)
    expect((await importModule(absoluteModulePath)).greet).toBe('hi')
    expect((await importModule(pathToFileURL(absoluteModulePath).toString())).greet).toBe('hi')
  })

  it('should be able to access __dirname and __filename', async () => {
    const res = await importFromString(`
      export const dirname = __dirname
      export const filename = __filename
    `)
    expect(res.dirname).toBe(__dirname)
    expect(res.filename).toMatch(__dirname)
  })

  it('should be able to access import.meta.url', async () => {
    const res = await importFromString('export const { url } = import.meta')
    expect(res.url).toMatch(pathToFileURL(__dirname).toString())
  })

  it('should not access other globals', async () => {
    expect.assertions(1)
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const res = (): Promise<string> => importFromString('export default process.cwd()')
    try {
      await res()
    } catch (error) {
      expect(Object.getPrototypeOf(error)).toHaveProperty('name', 'ReferenceError')
    }
  })

  it('should work with provided globals', async () => {
    const res = await importFromString('export const cwd = process.cwd()', {
      globals: { process }
    })
    expect(res.cwd).toBe(process.cwd())
  })

  it('should have access the global object', async () => {
    const res = await importFromString('export const { greet } = global', {
      globals: { greet: 'hi' }
    })
    expect(res.greet).toBe('hi')
  })

  it('should have same globalThis', async () => {
    const code = 'export default global.globalThis === globalThis.global'
    expect((await importFromString(code)).default).toBeTruthy()
    expect((await importFromString(code, { useCurrentGlobal: true })).default).toBeTruthy()
  })

  it('should work with current global', async () => {
    const importFromStringFn = createImportFromString({ useCurrentGlobal: true })
    expect((await importFromStringFn('export default new Error()')).default).toBeInstanceOf(Error)
    expect((await importFromStringFn('export default new global.Error()')).default).toBeInstanceOf(Error) // prettier-ignore
  })

  it('should be able to override current global', async () => {
    const importFromStringFn = createImportFromString({
      globals: { Error: Array },
      useCurrentGlobal: true
    })
    expect((await importFromStringFn('export default new Error()')).default).toBeInstanceOf(Array)
    expect((await importFromStringFn('export default new global.Error()')).default).toBeInstanceOf(Array) // prettier-ignore
  })

  it('should work if transformOption is provided', async () => {
    const res = await importFromString("export default function(): string { return 'hi' }", {
      transformOptions: { loader: 'ts' }
    })
    expect(res.default()).toBe('hi')
  })

  it('should use relative filename in error stack trace', async () => {
    expect.assertions(1)
    const filename = 'foo.js'
    const relativeDirnamePath = path.relative(process.cwd(), __dirname)
    const relativeFilenamePath = path.join(relativeDirnamePath, filename)
    const relativeFilename = normalizePath(relativeFilenamePath)
    try {
      await importFromString('throw new Error("boom")', {
        filename,
        useCurrentGlobal: true
      })
    } catch (err) {
      if (err instanceof Error) {
        expect(err.stack).toMatch(`${relativeFilename}:`)
      } else {
        throw err
      }
    }
  })

  it('should use absolute filename in error stack trace', async () => {
    expect.assertions(1)
    const filenamePath = path.join(os.homedir(), 'foo', 'bar', 'baz.js')
    const filename = pathToFileURL(filenamePath).toString()
    try {
      await importFromString('throw new Error("boom")', {
        filename,
        useCurrentGlobal: true
      })
    } catch (err) {
      if (err instanceof Error) {
        expect(err.stack).toMatch(`${filename}:`)
      } else {
        throw err
      }
    }
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
