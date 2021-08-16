import { Module, createRequire } from 'module'
import path from 'path'
import vm from 'vm'
import { nanoid } from 'nanoid'
import {
  isInESModuleScope,
  getCallerDirname,
  resolveModuleSpecifier,
  getEntryDirname
} from './utils'

export interface Options {
  dirname?: string
  globals?: Record<string, unknown>
}

export const requireFromString = (code: string, { dirname, globals }: Options = {}): any => {
  const mainModule = isInESModuleScope() ? undefined : require.main
  const moduleDirname = dirname ?? mainModule?.path ?? getCallerDirname() ?? getEntryDirname()
  const moduleFilename = path.join(moduleDirname, `${nanoid()}.js`)
  const contextModule = new Module(moduleFilename, mainModule)

  contextModule.filename = moduleFilename
  contextModule.path = moduleDirname
  contextModule.paths = mainModule?.paths ?? []
  contextModule.require = createRequire(moduleFilename)

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
    {
      // @ts-expect-error: experimental
      async importModuleDynamically(specifier: string) {
        return await import(resolveModuleSpecifier(specifier, moduleDirname))
      }
    }
  )

  contextModule.loaded = true
  return contextModule.exports
}
