# module-from-string

> Load module from string using `require` or `import`.

[![npm](https://img.shields.io/npm/v/module-from-string)](https://www.npmjs.com/package/module-from-string)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/exuanbo/module-from-string/Node.js%20CI/main)](https://github.com/exuanbo/module-from-string/actions?query=workflow)
[![Codecov branch](https://img.shields.io/codecov/c/gh/exuanbo/module-from-string/main?token=B66P1ZSBLD)](https://codecov.io/gh/exuanbo/module-from-string)
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

## Install

```sh
npm install module-from-string
```

## Usage

```js
import {
  requireFromString,
  importFromString,
  importFromStringSync
} from 'module-from-string'

requireFromString("module.exports = 'hi'") // => 'hi'
requireFromString("exports.greet = 'hi'") // => { greet: 'hi' }

;(async () => {
  await importFromString("export default 'hi'") // => { default: 'hi' }
})()

importFromStringSync(
  "export const greet = Buffer.from([0x68, 0x69]).toString('utf8')",
  { globals: { Buffer } }
) // => { greet: 'hi' }
```

## API

```ts
import { TransformOptions } from 'esbuild'

interface Options {
  globals?: Record<string, unknown>
}

declare const requireFromString: (code: string, options?: Options) => any

interface ImportOptions extends Options {
  transformOptions?: TransformOptions
}

declare const importFromString: (
  code: string,
  options?: ImportOptions
) => Promise<any>

declare const importFromStringSync: (
  code: string,
  options?: ImportOptions
) => any

export { requireFromString, importFromString, importFromStringSync }
```

### globals

Underneath the hood, `module-from-string` uses Node.js built-in `vm` module to execute code.

```ts
vm.runInNewContext(
  code,
  {
    __dirname: contextModule.path,
    __filename: contextModule.filename,
    exports: contextModule.exports,
    module: contextModule,
    require: contextModule.require,
    ...globals
  },
  { microtaskMode: 'afterEvaluate' }
)
```

By default, only the above variables are passed into the `contextObject`. In order to use other global objects and built-in modules you need to add them to option `globals`.

```js
requireFromString(
  'module.exports = process.cwd()',
  { globals: { process } }
)// => $PWD
```

### transformOptions

Function `importFromString` and `importFromStringSync` use esbuild to transform ES Module syntax to CommonJS. So it can do much more by providing transform options to esbuild. See [esbuild Transform API](https://esbuild.github.io/api/#transform-api) for documentation.

```js
const { greet } = importFromStringSync(
  "export const greet: () => string = () => 'hi'",
  { transformOptions: { loader: 'ts' } }
)

greet() // => 'hi'
```

## License

[MIT License](https://github.com/exuanbo/module-from-string/blob/main/LICENSE) © 2021 [Exuanbo](https://github.com/exuanbo)
