import path from 'path'
import vm from 'vm'
import { TransformOptions, transform, transformSync } from 'esbuild'
import { nanoid } from 'nanoid'
import { Options, requireFromString } from './require'
import { isInESModuleScope, getESModuleError } from './utils'

export interface ImportOptions extends Options {
  transformOptions?: TransformOptions
}

export const importFromString = async (
  code: string,
  { dirPath, globals, transformOptions }: ImportOptions = {}
): Promise<any> => {
  if (!isInESModuleScope()) {
    ;({ code } = await transform(code, {
      format: 'cjs',
      ...transformOptions
    }))
    return requireFromString(code, { dirPath, globals })
  }

  // @ts-expect-error: experimental
  if (vm.Module === undefined) {
    throw new Error('command flag `--experimental-vm-modules` is not enabled')
  }

  if (transformOptions !== undefined) {
    ;({ code } = await transform(code, {
      format: 'esm',
      ...transformOptions
    }))
  }

  const dirName = dirPath ?? path.dirname(process.argv[1])
  const modulePath = path.join(dirName, `${nanoid()}.js`)
  const context = vm.createContext({
    __IMPORTS__: {},
    ...globals
  })

  // @ts-expect-error: experimental
  const vmModule = new vm.SourceTextModule(code, {
    identifier: modulePath,
    context
  })

  // @ts-expect-error: experimental
  const linker = async (specifier: string): Promise<vm.Module> => {
    const importedModulePath = new RegExp(`^[.\\${path.sep}]`).test(specifier)
      ? path.resolve(dirName, specifier)
      : undefined
    const importedModuleIdentifier = importedModulePath ?? specifier
    const importedModule = await import(importedModuleIdentifier)
    context.__IMPORTS__[specifier] = importedModule

    const exportedNames = new Set(Object.getOwnPropertyNames(importedModule))
    const importedModuleContent = `${
      exportedNames.delete('default') ? `export default __IMPORTS__['${specifier}'].default\n` : ''
    }export const { ${[...exportedNames].join(', ')} } = __IMPORTS__['${specifier}']`

    // @ts-expect-error: experimental
    return new vm.SourceTextModule(importedModuleContent, {
      identifier: importedModuleIdentifier,
      context
    })
  }

  await vmModule.link(linker)
  await vmModule.evaluate()
  return vmModule.namespace
}

export const importFromStringSync = (
  code: string,
  { dirPath, globals, transformOptions }: ImportOptions = {}
): any => {
  if (isInESModuleScope()) {
    throw getESModuleError('importFromStringSync')
  }

  ;({ code } = transformSync(code, {
    format: 'cjs',
    ...transformOptions
  }))
  return requireFromString(code, { dirPath, globals })
}
