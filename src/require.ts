import { Module } from 'module'
import { runInNewContext } from 'vm'
import { nanoid } from 'nanoid'

export interface Options {
  globals?: Record<string, unknown>
}

export const requireFromString = (code: string, options: Options = {}): any => {
  const { globals = {} } = options

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
