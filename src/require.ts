import { Module } from 'module'
import { createContext, runInContext } from 'vm'
import { checkArg } from './utils'

export interface Options {
  code: string
  globals?: Record<string, unknown>
}

export const requireFromString = ({ code, globals = {} }: Options): any => {
  checkArg(code)

  const _module = new Module(String(new Date().valueOf()))

  const context = createContext({
    exports: _module.exports,
    module: _module,
    require,
    ...globals
  })

  runInContext(code, context)

  return context.module.exports
}
