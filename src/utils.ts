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

const FILE_URL_SCHEME = 'file:'

const fileURLToPath = (value: string): string =>
  value.startsWith(FILE_URL_SCHEME) ? url.fileURLToPath(value) : value

// `path.join` will transform `file:///home` to `file:/home`
export const pathToFileURL = (value: string): string =>
  (value.startsWith(FILE_URL_SCHEME) ? new URL(value) : url.pathToFileURL(value)).href

const FUNCTION_NAMES: readonly string[] = [
  'getCallerDirname',
  'requireFromString',
  'importFromStringSync',
  'importFromString',
  'processTicksAndRejections'
]

export const getCallerDirname = (): string => {
  const __prepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (_err, stackTraces) => stackTraces
  const callSites = (new Error().stack as unknown as NodeJS.CallSite[]).filter(callSite => {
    const functionName = callSite.getFunctionName()
    return functionName === null || !FUNCTION_NAMES.includes(functionName)
  })
  Error.prepareStackTrace = __prepareStackTrace
  const callerFilename = callSites[0].getFileName()
  return path.dirname(callerFilename === null ? process.argv[1] : fileURLToPath(callerFilename))
}

export const resolveModuleSpecifier = (specifier: string, dirname: string): string => {
  const specifierPath = fileURLToPath(specifier)
  return specifierPath.startsWith('.') || path.isAbsolute(specifierPath)
    ? path.resolve(dirname, specifierPath)
    : specifier
}
