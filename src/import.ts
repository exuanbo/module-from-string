import path from 'path'
import vm from 'vm'
import { TransformOptions, transform, transformSync } from 'esbuild'
import { nanoid } from 'nanoid'
import { Options, requireFromString } from './require'
import { isVMModuleAvailable, getCallerDirname, resolveModuleSpecifier } from './utils'

const ERR_REQUIRE_ESM = 'ERR_REQUIRE_ESM'

const IMPORT_META_URL_SHIM =
  "var import_meta_url = require('url').pathToFileURL(__filename).toString();"

// TODO: refactor
const IMPORT_META_RESOLVE_SHIM =
  "var import_meta_resolve = (specifier, parent) => require.resolve(require('path').resolve(parent != null ? parent : __dirname, specifier));"

const getCJS = (transformOptions: TransformOptions | undefined): TransformOptions => {
  return {
    ...transformOptions,
    banner:
      `${transformOptions?.banner !== undefined ? `${transformOptions.banner}\n` : ''}` +
      `${IMPORT_META_URL_SHIM}\n` +
      `${IMPORT_META_RESOLVE_SHIM}`,
    define: {
      'import.meta.url': 'import_meta_url',
      'import.meta.resolve': 'import_meta_resolve',
      ...transformOptions?.define
    },
    format: 'cjs'
  }
}

export interface ImportOptions extends Options {
  transformOptions?: TransformOptions
}

export const importFromString = async (
  code: string,
  { dirname, globals, transformOptions }: ImportOptions = {}
): Promise<any> => {
  if (!isVMModuleAvailable()) {
    const { code: transformedCode } = await transform(code, getCJS(transformOptions))
    try {
      return requireFromString(transformedCode, { dirname, globals })
    } catch (err) {
      if (err.code === ERR_REQUIRE_ESM) {
        throw new Error(
          'importing ES modules is supported only by enabling `--experimental-vm-modules` command flag'
        )
      }
      throw err
    }
  }

  const moduleDirname = dirname ?? getCallerDirname()
  const moduleFilename = path.join(moduleDirname, `${nanoid()}.js`)

  const context = vm.createContext({
    __imports__: {},
    ...globals
  })

  const { code: transformedCode = undefined } =
    transformOptions !== undefined
      ? await transform(code, {
          format: 'esm',
          ...transformOptions
        })
      : {}

  // @ts-expect-error: experimental
  const vmModule = new vm.SourceTextModule(transformedCode ?? code, {
    identifier: moduleFilename,
    context,
    initializeImportMeta(meta: ImportMeta) {
      meta.url = moduleFilename
    },
    async importModuleDynamically(specifier: string) {
      return await import(resolveModuleSpecifier(specifier, moduleDirname))
    }
  })

  // @ts-expect-error: experimental
  const linker = async (specifier: string): Promise<vm.Module> => {
    const resolvedSpecifier = resolveModuleSpecifier(specifier, moduleDirname)
    const targetModule = await import(resolvedSpecifier)
    context.__imports__[specifier] = targetModule

    const exportedNames = new Set(Object.getOwnPropertyNames(targetModule))
    const targetModuleContent = `${
      exportedNames.delete('default') ? `export default __imports__['${specifier}'].default;\n` : ''
    }export const { ${[...exportedNames].join(', ')} } = __imports__['${specifier}'];`

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
  { dirname, globals, transformOptions }: ImportOptions = {}
): any => {
  const { code: transformedCode } = transformSync(code, getCJS(transformOptions))
  try {
    return requireFromString(transformedCode, { dirname, globals })
  } catch (err) {
    if (err.code === ERR_REQUIRE_ESM) {
      throw new Error(
        `importing ES modules is not supported
Use asynchronous function \`importFromString\` instead and execute node with \`--experimental-vm-modules\` command flag.`
      )
    }
    throw err
  }
}
