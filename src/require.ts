import { Module, createRequire } from 'module'
import { join } from 'path'
import { runInNewContext } from 'vm'
import { nanoid } from 'nanoid'
import { isInESModuleScope, getCallerDirname, resolveModuleSpecifier } from './utils'

export interface Options {
  dirname?: string
  globals?: Record<string, unknown>
}

export const requireFromString = (
  code: string,
  { dirname = getCallerDirname(), globals }: Options = {}
): any => {
  const moduleFilename = join(dirname, `${nanoid()}.js`)
  const mainModule = isInESModuleScope() ? undefined : require.main
  const contextModule = new Module(moduleFilename, mainModule)

  contextModule.filename = moduleFilename
  contextModule.path = dirname
  contextModule.paths = mainModule?.paths ?? []
  contextModule.require = createRequire(moduleFilename)

  runInNewContext(
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
        return await import(resolveModuleSpecifier(specifier, contextModule.path))
      }
    }
  )

  contextModule.loaded = true
  return contextModule.exports
}
