import path from 'path'
import vm from 'vm'
import { TransformOptions, transform, transformSync } from 'esbuild'
import { nanoid } from 'nanoid'
import { Options, requireFromString } from './require'
import {
  isInESModuleScope,
  isVMModuleAvailable,
  resolveModuleSpecifier,
  getCallerDirname,
  getEntryDirname
} from './utils'

export interface ImportOptions extends Options {
  transformOptions?: TransformOptions
}

export const importFromString = async (
  code: string,
  { dirname, globals, transformOptions }: ImportOptions = {}
): Promise<any> => {
  if (!isInESModuleScope()) {
    const { code: transformedCode } = await transform(code, {
      format: 'cjs',
      ...transformOptions
    })
    return requireFromString(transformedCode, { dirname, globals })
  }

  if (!isVMModuleAvailable()) {
    throw new Error('command flag `--experimental-vm-modules` is not enabled')
  }

  const moduleDirname = dirname ?? getCallerDirname() ?? getEntryDirname()
  const moduleFilename = path.join(moduleDirname, `${nanoid()}.js`)

  const context = vm.createContext({
    __IMPORTS__: {},
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
    context.__IMPORTS__[specifier] = targetModule

    const exportedNames = new Set(Object.getOwnPropertyNames(targetModule))
    const targetModuleContent = `${
      exportedNames.delete('default') ? `export default __IMPORTS__['${specifier}'].default\n` : ''
    }export const { ${[...exportedNames].join(', ')} } = __IMPORTS__['${specifier}']`

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
  if (isInESModuleScope()) {
    throw new Error(
      `function \`importFromStringSync\` can not work in ES module scope
Use asynchronous function \`importFromString\` instead and execute node with \`--experimental-vm-modules\` command flag.`
    )
  }

  const { code: transformedCode } = transformSync(code, {
    format: 'cjs',
    ...transformOptions
  })
  return requireFromString(transformedCode, { dirname, globals })
}
