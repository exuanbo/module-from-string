import { createRequire } from 'module'
import path from 'path'
import vm from 'vm'
import { TransformOptions, transform, transformSync } from 'esbuild'
import { nanoid } from 'nanoid'
import acorn, { parse } from 'acorn'
import { simple as simpleWalk } from 'acorn-walk'
import { Options, requireFromString } from './require'
import { isInESModuleScope, ESModuleNotSupportedError, VmModuleNotEnabledError } from './utils'

interface ImportDeclarationNode extends acorn.Node {
  specifiers: Array<
    | {
        type: 'ImportDefaultSpecifier'
      }
    | {
        type: 'ImportSpecifier'
        imported: {
          name: string
        }
      }
  >
  source: {
    value: string
  }
}

export interface ImportOptions extends Options {
  transformOptions?: TransformOptions
}

export const importFromString = async (code: string, options: ImportOptions = {}): Promise<any> => {
  const { dirPath, globals, transformOptions } = options

  if (isInESModuleScope()) {
    // @ts-expect-error: experimental
    if (vm.Module === undefined) {
      throw new VmModuleNotEnabledError()
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

    let acornNode: acorn.Node

    // @ts-expect-error: experimental
    const linker = async (specifier: string): Promise<vm.Module> => {
      const importedModulePath = new RegExp(`^[\\.\\${path.sep}]`).test(specifier)
        ? path.resolve(dirName, specifier)
        : undefined
      context.__IMPORTS__[specifier] = await import(importedModulePath ?? specifier)

      if (acornNode === undefined) {
        acornNode = parse(code, {
          ecmaVersion: 'latest',
          sourceType: 'module'
        })
      }

      let importedModuleContent = ''

      simpleWalk(acornNode, {
        ImportDeclaration(__node) {
          const { specifiers: specifierNodes, source } = __node as ImportDeclarationNode
          if (source.value === specifier) {
            const namedExports = new Set<string>()
            let hasDefaultExport = false
            specifierNodes.forEach(specifierNode => {
              if (
                specifierNode.type === 'ImportDefaultSpecifier' ||
                specifierNode.imported.name === 'default'
              ) {
                hasDefaultExport = true
              } else {
                namedExports.add(specifierNode.imported.name)
              }
            })
            if (namedExports.size > 0) {
              importedModuleContent += `export const { ${[...namedExports].join(
                ', '
              )} } = __IMPORTS__['${specifier}']\n`
            }
            if (hasDefaultExport) {
              importedModuleContent += `export default __IMPORTS__['${specifier}'].default\n`
            }
          }
        }
      })

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

  const transformResult = await transform(code, {
    format: 'cjs',
    ...transformOptions
  })

  return requireFromString(transformResult.code, { dirPath, globals })
}

export const importFromStringSync = (code: string, options: ImportOptions = {}): any => {
  if (isInESModuleScope()) {
    throw new ESModuleNotSupportedError('importFromStringSync')
  }

  const { dirPath, globals, transformOptions = {} } = options

  const transformResult = transformSync(code, {
    format: 'cjs',
    ...transformOptions
  })

  return requireFromString(transformResult.code, { dirPath, globals })
}
