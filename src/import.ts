import path from 'path'
import vm from 'vm'
import { TransformOptions, transform, transformSync } from 'esbuild'
import { nanoid } from 'nanoid'
import { Options, requireFromString } from './require'
import { isInESModuleScope, getCallerDirname, getEntryDirname } from './utils'

export interface ImportOptions extends Options {
  transformOptions?: TransformOptions
}

export const importFromString = async (
  code: string,
  { dirname, globals, transformOptions }: ImportOptions = {}
): Promise<any> => {
  if (!isInESModuleScope()) {
    ;({ code } = await transform(code, {
      format: 'cjs',
      ...transformOptions
    }))
    return requireFromString(code, { dirname, globals })
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

  const moduleDirname = dirname ?? getCallerDirname() ?? getEntryDirname()
  const moduleFilename = path.join(moduleDirname, `${nanoid()}.js`)

  const context = vm.createContext({
    __IMPORTS__: {},
    ...globals
  })

  // @ts-expect-error: experimental
  const vmModule = new vm.SourceTextModule(code, {
    identifier: moduleFilename,
    context
  })

  // @ts-expect-error: experimental
  const linker = async (specifier: string): Promise<vm.Module> => {
    const importedModuleFilename = new RegExp(`^[.\\${path.sep}]`).test(specifier)
      ? path.resolve(moduleDirname, specifier)
      : undefined
    const importedModule = await import(importedModuleFilename ?? specifier)
    context.__IMPORTS__[specifier] = importedModule

    const exportedNames = new Set(Object.getOwnPropertyNames(importedModule))
    const importedModuleContent = `${
      exportedNames.delete('default') ? `export default __IMPORTS__['${specifier}'].default\n` : ''
    }export const { ${[...exportedNames].join(', ')} } = __IMPORTS__['${specifier}']`

    // @ts-expect-error: experimental
    return new vm.SourceTextModule(importedModuleContent, {
      identifier: importedModuleFilename ?? specifier,
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

  ;({ code } = transformSync(code, {
    format: 'cjs',
    ...transformOptions
  }))
  return requireFromString(code, { dirname, globals })
}
