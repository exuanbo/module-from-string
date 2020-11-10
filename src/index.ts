import { createContext, runInContext } from 'vm'

export const requireFromString = (code: string): any => {
  const context = createContext({ module: { exports: {} }, exports: {} })

  runInContext(code, context)

  if (Object.keys(context.exports).length > 0) {
    context.module.exports = context.exports
  }

  const { exports } = context.module

  return exports.default ?? exports
}
