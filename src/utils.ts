import path from 'path'
import { fileURLToPath } from 'url'
import vm from 'vm'

export const isInESModuleScope = (): boolean => {
  try {
    return module === undefined
  } catch {
    return true
  }
}

export const isVMModuleAvailable = (): boolean => {
  // @ts-expect-error: experimental
  return vm.Module !== undefined
}

export const getCallerDirname = (): string | null => {
  const _prepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (_err, stackTraces) => stackTraces
  const callSites = (new Error().stack as unknown as NodeJS.CallSite[]).slice(2)
  Error.prepareStackTrace = _prepareStackTrace
  const fileName = callSites[0].getFileName()
  return fileName !== null
    ? path.dirname(fileName.startsWith('file://') ? fileURLToPath(new URL(fileName)) : fileName)
    : null
}

export const getEntryDirname = (): string => path.dirname(process.argv[1])
