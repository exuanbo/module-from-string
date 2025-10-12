import { Module, createRequire } from 'module'
import { Context, runInNewContext } from 'vm'
import { nanoid } from 'nanoid'
import {
  isInESModuleScope,
  ensurePath,
  getCallerDirname,
  getModuleFilename,
  createGlobalObject,
  createContextObject,
  resolveModuleSpecifier
} from './utils'

export interface Options {
  filename?: string | undefined
  dirname?: string | undefined
  globals?: Context | undefined
  useCurrentGlobal?: boolean | undefined
}

export const requireFromString = (
  code: string,
  {
    filename = `${nanoid()}.js`,
    dirname = getCallerDirname(),
    globals = {},
    useCurrentGlobal = false
  }: Options | undefined = {}
): any => {
  const moduleFilename = ensurePath(getModuleFilename(dirname, filename))
  const mainModule = isInESModuleScope() ? undefined : require.main
  const contextModule = new Module(moduleFilename, mainModule)

  contextModule.require = createRequire(moduleFilename)
  contextModule.filename = moduleFilename
  contextModule.paths = mainModule?.paths ?? []

  const globalMap = createGlobalObject(globals, useCurrentGlobal)
  const contextObject = createContextObject(
    {
      exports: contextModule.exports,
      require: contextModule.require,
      module: contextModule,
      __filename: contextModule.filename,
      __dirname: contextModule.path
    },
    globalMap
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
  (options?: Options | undefined): typeof requireFromString =>
  (code, additionalOptions) =>
    requireFromString(code, {
      ...options,
      ...additionalOptions
    })
