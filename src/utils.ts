import path from 'path'
import url from 'url'
import vm from 'vm'

const VALID_PATH_REGEXP = /^[./\\]/

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
  value.startsWith('file://') ? url.fileURLToPath(value) : value

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
  const callSites = (new Error().stack as unknown as NodeJS.CallSite[]).filter(callSite => {
    const functionName = callSite.getFunctionName()
    return functionName === null || !FUNCTION_NAMES.includes(functionName)
  })
  Error.prepareStackTrace = _prepareStackTrace
  const callerFilename = callSites[0].getFileName()
  return path.dirname(callerFilename !== null ? fileURLToPath(callerFilename) : process.argv[1])
}

export const resolveModuleSpecifier = (specifier: string, dirname: string): string => {
  const specifierPath = fileURLToPath(specifier)
  return VALID_PATH_REGEXP.test(specifierPath) ? path.resolve(dirname, specifierPath) : specifier
}
