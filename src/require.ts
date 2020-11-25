import { Module } from 'module'
import { createContext, runInContext } from 'vm'
import { checkArg } from './utils'

export const requireFromString = (
  code: string,
  globals: Record<string, unknown> = {}
): any => {
  checkArg(code)

  const _module = new Module(Symbol('module').toString())

  const context = createContext({
    __dirname,
    __filename,
    exports: _module.exports,
    module: _module,
    require,
    ...globals
  })

  runInContext(code, context)

  return context.module.exports
}
