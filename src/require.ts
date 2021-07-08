import { Module } from 'module'
import { runInNewContext } from 'vm'
import { nanoid } from 'nanoid'
import { generateOptions } from './utils'

export interface Options {
  code: string
  globals?: Record<string, unknown>
}

export const requireFromString = (options: string | Options): any => {
  const { code, globals } = generateOptions(options)

  const contextModule = new Module(nanoid())

  runInNewContext(
    code,
    {
      exports: contextModule.exports,
      module: contextModule,
      require,
      ...globals
    },
    { microtaskMode: 'afterEvaluate' }
  )

  return contextModule.exports
}
