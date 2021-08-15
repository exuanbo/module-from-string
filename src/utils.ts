import path from 'path'
import { fileURLToPath } from 'url'

export const isInESModuleScope = (): boolean => {
  try {
    return module === undefined
  } catch {
    return true
  }
}

export const getCallerDirName = (): string | null => {
  const _prepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (_err, stack) => stack
  const stack = (new Error().stack as unknown as NodeJS.CallSite[]).slice(2)
  Error.prepareStackTrace = _prepareStackTrace
  const fileName = stack[0].getFileName()
  return fileName !== null
    ? path.dirname(fileName.startsWith('file://') ? fileURLToPath(new URL(fileName)) : fileName)
    : null
}
