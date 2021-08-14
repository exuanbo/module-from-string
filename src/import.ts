import { createRequire } from 'module'
import path from 'path'
import vm from 'vm'
import { Module as ModuleAST, parse, transform, transformSync } from '@swc/core'
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

  const getModuleAST = (() => {
    let ast: ModuleAST
    return async () => {
      if (ast === undefined) {
        ast = await parse(code, transformOptions?.jsc?.parser)
      }
      return ast
    }
  })()

  if (transformOptions !== undefined) {
    ;({ code } = await transform(
      await getModuleAST(),
      getDefaultTransformOptions(transformOptions)
    ))
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

  const getImportsMap = (() => {
    let importsMap: Map<string, Set<string>>
    return async () => {
      if (importsMap === undefined) {
        importsMap = new Map()
        ;(await getModuleAST()).body.forEach(node => {
          if (node.type === 'ImportDeclaration') {
            const source = node.source.value
            if (!importsMap.has(source)) {
              importsMap.set(source, new Set())
            }
            const importedNames = importsMap.get(source)!
            node.specifiers.forEach(importSpecifier => {
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
      return importsMap
    }
  })()

  // @ts-expect-error: experimental
  const linker = async (specifier: string): Promise<vm.Module> => {
    const importedModulePath = new RegExp(`^[.\\${path.sep}]`).test(specifier)
      ? path.resolve(dirName, specifier)
      : undefined
    context.__IMPORTS__[specifier] = await import(importedModulePath ?? specifier)

    let importedModuleContent = ''

    const importedNames = (await getImportsMap()).get(specifier)!
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
