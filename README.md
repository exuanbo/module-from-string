# module-from-string

> Load module from string using `require` or `import`.

[![npm](https://img.shields.io/npm/v/module-from-string.svg)](https://www.npmjs.com/package/module-from-string)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/exuanbo/module-from-string/Node.js%20CI/main.svg)](https://github.com/exuanbo/module-from-string/actions?query=workflow)
[![Node.js](https://img.shields.io/badge/node-%3E%3D12.20.0-brightgreen.svg)](https://nodejs.org/)
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
import { Context } from 'vm';
import { TransformOptions } from 'esbuild';

interface Options {
  filename?: string
  dirname?: string
  globals?: Context
  useCurrentGlobal?: boolean
}

declare const requireFromString: (code: string, options?: Options) => any
declare const createRequireFromString: (options?: Options) => typeof requireFromString

interface ImportOptions extends Options {
  transformOptions?: TransformOptions
}

declare const importFromString: (code: string, options?: ImportOptions) => Promise<any>
declare const createImportFromString: (options?: ImportOptions) => typeof importFromString

declare const importFromStringSync: (code: string, options?: ImportOptions) => any
declare const createImportFromStringSync: (options?: ImportOptions) => typeof importFromStringSync
```

### filename

Name, path or URL string of the virtual file for better exception stack trace.

```js
requireFromString(
  "throw new Error('boom!')",
  { filename: '/home/foo.js' }
)
// /home/foo.js:1
// throw new Error('boom!')
// ^
//
// Error: boom!
//     at /home/foo.js:1:7
//     at ...
```

### dirname

Path or URL string of the directory for resolving `require` or `import` from relative path.

```js
requireFromString(
  "module.exports = require('.')",
  { dirname: path.join(__dirname, "../lib") }
) // => require('../lib')
```

If not specified, the default value will be the current file's directory.

### globals

Underneath the hood, `module-from-string` uses Node.js built-in `vm` module to execute code.

```js
// requireFromString

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
```

Take `requireFromString` for example, only the module scope variables are passed into the `contextObject`.

In order to use other [global objects](https://nodejs.org/api/globals.html) that are specific to Node.js, they need to be added to option `globals` **or** set option [`useCurrentGlobal`](#usecurrentglobal) to `true`.

```js
requireFromString(
  'module.exports = process.cwd()',
  { globals: { process } }
) // => $PWD
```

**Note**: by default the [built-in objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects) have a different prototype.

```js
const error = requireFromString('module.exports = new Error()')
error instanceof Error // => false
```

### useCurrentGlobal

Default to `false`. If set to `true`, all the available variables from the current `global` (or `globalThis`) are passed into the context.

### transformOptions

Function `importFromString` and `importFromStringSync` can use `esbuild` to transform code syntax. See [esbuild Transform API](https://esbuild.github.io/api/#transform-api) for documentation.

```js
const { greet } = importFromStringSync(
  "export const greet: () => string = () => 'hi'",
  { transformOptions: { loader: 'ts' } }
)

greet() // => 'hi'
```

## ES modules

Dynamic `import()` expression of ES modules is supported by all three functions `requireFromString`, `importFromString` and `importFromStringSync`.

```js
;(async () => {
  await requireFromString("module.exports = import('./index.mjs')")
})()
```

`import` statement of ES modules is supported only by asynchronous function `importFromString` using Node.js experimental API [`vm.Module`](https://nodejs.org/api/vm.html#vm_class_vm_module).

```sh
node --experimental-vm-modules index.js

# Or use environment variable
NODE_OPTIONS=--experimental-vm-modules node index.js
```

```js
// with top-level await

await importFromString("export { foo as default } from './index.mjs'")
```

## License

[MIT License](https://github.com/exuanbo/module-from-string/blob/main/LICENSE) © 2021 [Exuanbo](https://github.com/exuanbo)
