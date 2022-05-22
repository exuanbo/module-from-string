import { join } from 'path'
import vm, { createContext } from 'vm'
import { TransformOptions, transform, transformSync } from 'esbuild'
import { nanoid } from 'nanoid/async'
import { Options, requireFromString } from './require'
import {
  isVMModuleAvailable,
  pathToFileURLString,
  getCallerDirname,
  resolveModuleSpecifier
} from './utils'

const USE_STRICT = '"use strict";'

const IMPORT_META_URL_SHIM =
  'var import_meta_url = require("url").pathToFileURL(__filename).toString();'

const IMPORT_META_RESOLVE_SHIM = `function import_meta_resolve() {
  throw new Error(
    \`'import.meta.resolve' is not supported
Use asynchronous function 'importFromString' and enable '--experimental-vm-modules' CLI option.
Or use 'transformOptions' to include a polyfill. See https://github.com/evanw/esbuild/issues/1492#issuecomment-893144483 as an example.\`
  );
}`

const getCommonJS = (transformOptions: TransformOptions | undefined): TransformOptions => {
  return {
    ...transformOptions,
    banner:
      `${USE_STRICT}\n` +
      `${IMPORT_META_URL_SHIM}\n` +
      `${IMPORT_META_RESOLVE_SHIM}\n` +
      `${transformOptions?.banner ?? ''}`,
    define: {
      'import.meta.url': 'import_meta_url',
      'import.meta.resolve': 'import_meta_resolve',
      ...transformOptions?.define
    },
    format: 'cjs'
  }
}

const ERR_REQUIRE_ESM = 'ERR_REQUIRE_ESM'

export interface ImportOptions extends Options {
  transformOptions?: TransformOptions
}

export const importFromString = async (
  code: string,
  { dirname = getCallerDirname(), globals, transformOptions }: ImportOptions = {}
): Promise<any> => {
  if (!isVMModuleAvailable()) {
    const { code: transformedCode } = await transform(code, getCommonJS(transformOptions))
    try {
      return requireFromString(transformedCode, { dirname, globals })
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === ERR_REQUIRE_ESM) {
        throw new Error(
          `'import' statement of ES modules is not supported
Enable '--experimental-vm-modules' CLI option or replace it with dynamic 'import()' expression.`
        )
      }
      throw err
    }
  }

  let transformedCode: string | undefined

  if (transformOptions !== undefined) {
    ;({ code: transformedCode } = await transform(code, {
      format: 'esm',
      ...transformOptions
    }))
  }

  const moduleFilename = join(dirname, `${await nanoid()}.js`)
  const moduleFileURLString = pathToFileURLString(moduleFilename)

  const context = createContext({
    __IMPORTS__: {},
    __dirname: dirname,
    __filename: moduleFilename,
    ...globals
  })

  // @ts-expect-error: experimental
  const vmModule = new vm.SourceTextModule(transformedCode ?? code, {
    identifier: moduleFileURLString,
    context,
    initializeImportMeta(meta: ImportMeta) {
      meta.url = moduleFileURLString
    },
    async importModuleDynamically(specifier: string) {
      return await import(resolveModuleSpecifier(specifier, dirname))
    }
  })

  // @ts-expect-error: experimental
  const linker = async (specifier: string): Promise<vm.Module> => {
    const resolvedSpecifier = resolveModuleSpecifier(specifier, dirname)
    const targetModule = await import(resolvedSpecifier)
    context.__IMPORTS__[specifier] = targetModule

    const exportedNames = Object.keys(targetModule)
    const targetModuleContent = `${
      exportedNames.includes('default')
        ? `export default __IMPORTS__['${specifier}'].default;\n`
        : ''
    }export const { ${exportedNames
      .filter(exportedName => exportedName !== 'default')
      .join(', ')} } = __IMPORTS__['${specifier}'];`

    // @ts-expect-error: experimental
    return new vm.SourceTextModule(targetModuleContent, {
      identifier: resolvedSpecifier,
      context
    })
  }

  await vmModule.link(linker)
  await vmModule.evaluate()
  return vmModule.namespace
}

export const importFromStringSync = (
  code: string,
  { dirname = getCallerDirname(), globals, transformOptions }: ImportOptions = {}
): any => {
  const { code: transformedCode } = transformSync(code, getCommonJS(transformOptions))
  try {
    return requireFromString(transformedCode, { dirname, globals })
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === ERR_REQUIRE_ESM) {
      throw new Error(
        `'import' statement of ES modules is not supported
Use asynchronous function 'importFromString' instead or replace it with dynamic 'import()' expression.`
      )
    }
    throw err
  }
}
