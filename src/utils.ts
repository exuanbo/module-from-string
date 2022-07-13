import { dirname, isAbsolute, resolve } from 'path'
import { URL, fileURLToPath, pathToFileURL } from 'url'
import vm, { Context } from 'vm'

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

const isFileURL = (value: string): boolean => value.startsWith(FILE_URL_SCHEME)

const fileURLStringToPath = (value: string): string =>
  isFileURL(value) ? fileURLToPath(value) : value

// `path.join` for some reason will transform `file:///home` to `file:/home`
// so we need to correct it using `URL` API
export const pathToFileURLString = (value: string): string =>
  (isFileURL(value) ? new URL(value) : pathToFileURL(value)).toString()

const internalFunctionNames: readonly string[] = [
  'getCallerDirname',
  'requireFromString',
  'importFromStringSync',
  'importFromString',
  'processTicksAndRejections'
]

export const getCallerDirname = (): string => {
  const __prepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (_err, stackTraces) => stackTraces
  // @ts-expect-error: safe to ignore
  const callSites = (new Error().stack as NodeJS.CallSite[]).filter(callSite => {
    const functionName = callSite.getFunctionName()
    return functionName === null || !internalFunctionNames.includes(functionName)
  })
  Error.prepareStackTrace = __prepareStackTrace
  const callerFilename = callSites[0].getFileName()
  return dirname(callerFilename === null ? process.argv[1] : fileURLStringToPath(callerFilename))
}

export const createGlobalProxy = (contextObject: Context): Context =>
  new Proxy(contextObject, {
    get: (target: Context, propKey: string) => {
      if (propKey in target) {
        return target[propKey]
      } else {
        return Reflect.get(global, propKey)
      }
    }
  })

export const resolveModuleSpecifier = (specifier: string, dirname: string): string => {
  const specifierPath = fileURLStringToPath(specifier)
  return specifierPath.startsWith('.') || isAbsolute(specifierPath)
    ? resolve(dirname, specifierPath)
    : specifier
}
