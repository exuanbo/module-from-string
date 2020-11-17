import { Module } from 'module'
import { createContext, runInContext } from 'vm'

export const requireFromString = (
  code: string,
  globals: { [object: string]: unknown } = {}
): any => {
  const argType = typeof code
  if (argType !== 'string') {
    throw new Error(`Argument must be string, not '${argType}'.`)
  }

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
