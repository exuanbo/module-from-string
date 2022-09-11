import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { requireFromString } from '../../src/index'

const __dirname = path.dirname(fileURLToPath(new URL(import.meta.url)))

it('should work with `module.exports`', () => {
  const res = requireFromString("module.exports = 'hi'")
  expect(res).toBe('hi')
})

it('should work with exports shortcut', () => {
  const res = requireFromString("exports.hello = 'hello'\nexports.hi = 'hi'")
  expect(res.hello).toBe('hello')
  expect(res.hi).toBe('hi')
})

it('should work with relative path require', () => {
  const modulePath = '../cjs/fixtures/defaultExport.js'
  const res = requireFromString(`module.exports = require('${modulePath}')`)
  expect(res).toBe('hi')
})

it('should resolve correctly if option `dirname` is provided', () => {
  const modulePath = './cjs/fixtures/namedExport.js'
  const res = requireFromString(`exports.greet = require('${modulePath}').greet`, {
    dirname: path.dirname(__dirname)
  })
  expect(res.greet).toBe('hi')
})

it('should work with absolute path require', () => {
  const modulePath = path.join(__dirname, '../cjs/fixtures/defaultExport.js')
  const res = requireFromString(`module.exports = require(${JSON.stringify(modulePath)})`)
  expect(res).toBe('hi')
})

it('should work with require external module', () => {
  const code = `const { transformSync } = require('esbuild')
const { code } = transformSync('enum Greet { Hi }', { loader: 'ts' })
exports.greet = code
`
  const res = requireFromString(code)
  expect(res.greet).toMatchInlineSnapshot(`
    "var Greet = /* @__PURE__ */ ((Greet2) => {
      Greet2[Greet2[\\"Hi\\"] = 0] = \\"Hi\\";
      return Greet2;
    })(Greet || {});
    "
  `)
})

it('should not access other globals', () => {
  const res = (): string => requireFromString('module.exports = process.cwd()')
  expect(res).toThrowError()
})

it('should work with provided globals', () => {
  const res = requireFromString('exports.cwd = process.cwd()', {
    globals: { process }
  })
  expect(res.cwd).toBe(process.cwd())
})

it('should have access the global object', () => {
  const res = requireFromString('module.exports = global.String(global.greet)', {
    globals: { greet: 'hi' }
  })
  expect(res).toBe('hi')
})

it('should have same globalThis', () => {
  const res = requireFromString('module.exports = global === globalThis')
  expect(res).toBeTruthy()
})

it('should work with current global', () => {
  const res = requireFromString('module.exports = new Error()', {
    useCurrentGlobal: true
  })
  expect(res).toBeInstanceOf(Error)
})

it('should use relative filename in error stack trace', () => {
  expect.assertions(1)
  const filename = 'foo.js'
  const relativeDirname = path.relative(process.cwd(), __dirname)
  const relativeFilename = path.join(relativeDirname, filename)
  try {
    requireFromString('throw new Error("boom")', {
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

it('should use absolute filename in error stack trace', () => {
  expect.assertions(1)
  const homedir = os.homedir()
  const normalizedHomedir = /^[A-Z]/.test(homedir)
    ? `${homedir[0].toLowerCase()}${homedir.slice(1)}`
    : homedir
  const filename = path.join(normalizedHomedir, 'foo', 'bar', 'baz.js')
  try {
    requireFromString('throw new Error("boom")', {
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
