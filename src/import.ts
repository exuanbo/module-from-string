import { createRequire } from 'module'
import path from 'path'
import vm from 'vm'
import { parse, transform, transformSync } from '@swc/core'
import { nanoid } from 'nanoid'
import { requireFromString } from './require'
import { ImportOptions, getDefaultTransformOptions, getCommonjsTransformOptions } from './options'
import { isInESModuleScope, ESModuleNotSupportedError, VmModuleNotEnabledError } from './utils'

export const importFromString = async (
  code: string,
  { dirPath, globals, transformOptions }: ImportOptions = {}
): Promise<any> => {
  if (!isInESModuleScope()) {
    ;({ code } = await transform(code, getCommonjsTransformOptions(transformOptions)))
    return requireFromString(code, { dirPath, globals })
  }

  // @ts-expect-error: experimental
  if (vm.Module === undefined) {
    throw new VmModuleNotEnabledError()
  }

  // TODO: should be lazy
  const swcModule = await parse(code, transformOptions?.jsc?.parser)

  if (transformOptions !== undefined) {
    ;({ code } = await transform(swcModule, getDefaultTransformOptions(transformOptions)))
  }

  const dirName = dirPath ?? path.dirname(process.argv[1])
  const modulePath = path.join(dirName, `${nanoid()}.js`)
  const context = vm.createContext({
    __IMPORTS__: {},
    require: createRequire(modulePath),
    ...globals
  })

  // @ts-expect-error: experimental
  const vmModule = new vm.SourceTextModule(code, {
    identifier: modulePath,
    context,
    initializeImportMeta(meta: ImportMeta) {
      meta.url = modulePath
    }
  })

  const importsMap = new Map<string, Set<string>>()

  // @ts-expect-error: experimental
  const linker = async (specifier: string): Promise<vm.Module> => {
    const importedModulePath = new RegExp(`^[.\\${path.sep}]`).test(specifier)
      ? path.resolve(dirName, specifier)
      : undefined
    context.__IMPORTS__[specifier] = await import(importedModulePath ?? specifier)

    let importedModuleContent = ''

    if (importsMap.size === 0) {
      swcModule.body.forEach(moduleItem => {
        if (moduleItem.type === 'ImportDeclaration') {
          const source = moduleItem.source.value
          if (!importsMap.has(source)) {
            importsMap.set(source, new Set())
          }
          const importedNames = importsMap.get(source)!
          moduleItem.specifiers.forEach(importSpecifier => {
            if (importSpecifier.type === 'ImportSpecifier') {
              if (importSpecifier.imported !== null) {
                importedNames.add(importSpecifier.imported.value)
              }
            } else {
              importedNames.add('default')
            }
          })
        }
      })
    }

    const importedNames = importsMap.get(specifier)!
    if (importedNames.has('default')) {
      importedModuleContent = `export default __IMPORTS__['${specifier}'].default\n`
      importedNames.delete('default')
    }
    if (importedNames.size > 0) {
      const names = [...importedNames].join(', ')
      importedModuleContent += `export const { ${names} } = __IMPORTS__['${specifier}']\n`
    }

    // @ts-expect-error: experimental
    return new vm.SourceTextModule(importedModuleContent, {
      identifier: importedModulePath ?? specifier,
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
    throw new ESModuleNotSupportedError('importFromStringSync')
  }

  ;({ code } = transformSync(code, getCommonjsTransformOptions(transformOptions)))
  return requireFromString(code, { dirPath, globals })
}
