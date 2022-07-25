import { Module, createRequire } from 'module'
import { join } from 'path'
import { Context, runInNewContext } from 'vm'
import { nanoid } from 'nanoid'
import {
  isInESModuleScope,
  getCallerDirname,
  createGlobalObject,
  createContextObject,
  resolveModuleSpecifier
} from './utils'

export interface Options {
  dirname?: string
  globals?: Context
  useCurrentGlobal?: boolean
}

export const requireFromString = (
  code: string,
  { dirname = getCallerDirname(), globals = {}, useCurrentGlobal = false }: Options = {}
): any => {
  const moduleFilename = join(dirname, `${nanoid()}.js`)
  const mainModule = isInESModuleScope() ? undefined : require.main
  const contextModule = new Module(moduleFilename, mainModule)

  contextModule.require = createRequire(moduleFilename)
  contextModule.filename = moduleFilename
  contextModule.paths = mainModule?.paths ?? []

  const globalObject = createGlobalObject(globals, useCurrentGlobal)
  const contextObject = createContextObject(
    {
      exports: contextModule.exports,
      require: contextModule.require,
      module: contextModule,
      __filename: contextModule.filename,
      __dirname: contextModule.path
    },
    globalObject
  )

  runInNewContext(code, contextObject, {
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
  (options?: Options): typeof requireFromString =>
  (code, additionalOptions) =>
    requireFromString(code, {
      ...options,
      ...additionalOptions
    })
