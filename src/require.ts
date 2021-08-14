import { Module, createRequire } from 'module'
import path from 'path'
import vm from 'vm'
import { nanoid } from 'nanoid'
import { isInESModuleScope, ESModuleNotSupportedError } from './utils'

export interface Options {
  dirPath?: string
  globals?: Record<string, unknown>
}

export const requireFromString = (code: string, options: Options = {}): any => {
  if (isInESModuleScope()) {
    throw new ESModuleNotSupportedError('requireFromString')
  }

  const { dirPath, globals = {} } = options

  const mainModule = require.main ?? undefined
  const dirName = dirPath ?? mainModule?.path ?? path.dirname(process.argv[1])
  const fileName = path.join(dirName, `${nanoid()}.js`)
  const contextModule = new Module(fileName, mainModule)

  contextModule.filename = fileName
  contextModule.path = mainModule?.path ?? dirName
  contextModule.paths = mainModule?.paths ?? []
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

  contextModule.loaded = true
  return contextModule.exports
}
