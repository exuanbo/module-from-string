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

const forEachPropertyKey = (
  context: Context,
  callbackfn: (propertyKey: string | symbol) => void
): void => {
  Object.getOwnPropertyNames(context).forEach(callbackfn)
  Object.getOwnPropertySymbols(context).forEach(callbackfn)
}

export const shallowMergeContext = (target: Context, source: Context): Context => {
  forEachPropertyKey(source, propertyKey => {
    Object.defineProperty(target, propertyKey, {
      ...Object.getOwnPropertyDescriptor(source, propertyKey)
    })
  })
  return target
}

const __GLOBAL__ = global

const getCurrentGlobal = (): Context => {
  const currentGlobal = shallowMergeContext({}, __GLOBAL__)
  delete currentGlobal.global
  delete currentGlobal.globalThis
  return currentGlobal
}

export const createGlobalObject = (globals: Context, useCurrentGlobal: boolean): Context => {
  const globalObject = useCurrentGlobal
    ? getCurrentGlobal()
    : Object.defineProperty({}, Symbol.toStringTag, {
        ...Object.getOwnPropertyDescriptor(__GLOBAL__, Symbol.toStringTag)
      })
  forEachPropertyKey(globals, propertyKey => {
    if (propertyKey in __GLOBAL__) {
      Object.defineProperty(globalObject, propertyKey, {
        ...Object.getOwnPropertyDescriptor(__GLOBAL__, propertyKey),
        value: globals[propertyKey as keyof Context]
      })
    } else {
      Object.defineProperty(globalObject, propertyKey, {
        ...Object.getOwnPropertyDescriptor(globals, propertyKey)
      })
    }
  })
  return globalObject
}

export const resolveModuleSpecifier = (specifier: string, dirname: string): string => {
  const specifierPath = fileURLStringToPath(specifier)
  return specifierPath.startsWith('.') || isAbsolute(specifierPath)
    ? resolve(dirname, specifierPath)
    : specifier
}
