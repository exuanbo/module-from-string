import { Module, createRequire } from 'module'
import path from 'path'
import vm from 'vm'
import { nanoid } from 'nanoid'

export interface Options {
  globals?: Record<string, unknown>
}

export const requireFromString = (code: string, options: Options = {}): any => {
  const { globals = {} } = options

  const mainModule = require.main!
  const fileName = path.join(mainModule.path, `${nanoid()}.js`)
  const contextModule = new Module(fileName, mainModule)
  contextModule.filename = fileName
  contextModule.path = mainModule.path
  contextModule.paths = mainModule.paths
  contextModule.require = createRequire(fileName)

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

  mainModule.children = mainModule.children.filter(m => m !== contextModule)

  return contextModule.exports
}
