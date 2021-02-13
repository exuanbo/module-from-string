import { Module } from 'module'
import { createContext, runInContext } from 'vm'
import { nanoid } from 'nanoid'
import { generateOptions } from './utils'

export interface Options {
  code: string
  globals?: Record<string, unknown>
}

export const requireFromString = (options: string | Options): any => {
  const { code, globals = {} } = generateOptions(options)

  const _module = new Module(nanoid())

  const context = createContext({
    exports: _module.exports,
    module: _module,
    require,
    ...globals
  })

  runInContext(code, context)

  return context.module.exports
}
