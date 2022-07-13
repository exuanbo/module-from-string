import { Module, createRequire } from 'module'
import { join } from 'path'
import { Context, createContext, runInContext } from 'vm'
import { nanoid } from 'nanoid'
import {
  isInESModuleScope,
  getCallerDirname,
  createGlobalProxy,
  resolveModuleSpecifier
} from './utils'

export interface Options {
  dirname?: string
  globals?: Context
  useCurrentGlobal?: boolean
}

export const requireFromString = (
  code: string,
  { dirname = getCallerDirname(), globals, useCurrentGlobal = false }: Options = {}
): any => {
  const moduleFilename = join(dirname, `${nanoid()}.js`)
  const mainModule = isInESModuleScope() ? undefined : require.main
  const contextModule = new Module(moduleFilename, mainModule)

  contextModule.filename = moduleFilename
  contextModule.path = dirname
  contextModule.paths = mainModule?.paths ?? []
  contextModule.require = createRequire(moduleFilename)

  const contextObject: Context = {
    __dirname: contextModule.path,
    __filename: contextModule.filename,
    exports: contextModule.exports,
    module: contextModule,
    require: contextModule.require,
    ...globals
  }
  const context = createContext(useCurrentGlobal ? createGlobalProxy(contextObject) : contextObject)
  context.global = context

  runInContext(code, context, {
    filename: moduleFilename,
    // @ts-expect-error: experimental
    async importModuleDynamically(specifier: string) {
      return await import(resolveModuleSpecifier(specifier, contextModule.path))
    }
  })

  contextModule.loaded = true
  return contextModule.exports
}

export const createRequireFromString =
  (options?: Options) =>
  (code: string): any =>
    requireFromString(code, options)
