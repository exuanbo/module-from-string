import path from 'path'
import url from 'url'
import vm from 'vm'

export const isInESModuleScope = (): boolean => {
  try {
    return module === undefined
  } catch {
    return true
  }
}

// @ts-expect-error: experimental
export const isVMModuleAvailable = (): boolean => vm.Module !== undefined

const fileURLToPath = (value: string): string =>
  value.startsWith('file://') ? url.fileURLToPath(new URL(value)) : value

const FUNCTION_NAMES = [
  'getCallerDirname',
  'requireFromString',
  'importFromString',
  'importFromStringSync',
  'processTicksAndRejections'
]

export const getCallerDirname = (): string => {
  const _prepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (_err, stackTraces) => stackTraces
  const callSites = (new Error().stack as unknown as NodeJS.CallSite[]).filter(
    callSite => !FUNCTION_NAMES.includes(String(callSite.getFunctionName()))
  )
  Error.prepareStackTrace = _prepareStackTrace
  const callerFilename = callSites[0].getFileName()
  return path.dirname(callerFilename !== null ? fileURLToPath(callerFilename) : process.argv[1])
}

export const resolveModuleSpecifier = (specifier: string, dirname: string): string => {
  const specifierPath = fileURLToPath(specifier)
  return new RegExp(`^[.\\${path.sep}]`).test(specifierPath)
    ? path.resolve(dirname, specifierPath)
    : specifier
}
