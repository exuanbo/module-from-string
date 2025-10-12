import { dirname, isAbsolute, resolve, sep } from 'path'
import { URL, fileURLToPath, pathToFileURL } from 'url'
import vm, { Context } from 'vm'

export const isInESModuleScope = (): boolean => {
  try {
    return module === undefined
  } catch {
    return true
  }
}

export const isVMModuleAvailable = (): boolean => vm.Module !== undefined

const FILE_URL_PROTOCOL = 'file:'

const isFileURL = (value: string): boolean => value.startsWith(FILE_URL_PROTOCOL)

export const ensureFileURL = (value: string): string =>
  isFileURL(value) ? value : pathToFileURL(value).toString()

export const ensurePath = (value: string): string =>
  isFileURL(value) ? fileURLToPath(value) : value

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
  const caller = callSites[0]
  const callerFilename = caller.getFileName() ?? process.argv[1]
  return dirname(ensurePath(callerFilename))
}

const ensureTrailingSeparator = (dirname: string): string => {
  const separator = isFileURL(dirname) ? '/' : sep
  return dirname.endsWith(separator) ? dirname : `${dirname}${separator}`
}

export const getModuleFilename = (dirname: string, filename: string): string => {
  if (isInESModuleScope()) {
    if (isFileURL(filename)) {
      return filename
    } else {
      const validatedDirname = ensureTrailingSeparator(dirname)
      return new URL(filename, ensureFileURL(validatedDirname)).toString()
    }
  } else {
    return resolve(ensurePath(dirname), ensurePath(filename))
  }
}

const forEachPropertyKey = (
  context: Context,
  callbackfn: (propertyKey: string | symbol) => void
): void => {
  Object.getOwnPropertyNames(context).forEach(callbackfn)
  Object.getOwnPropertySymbols(context).forEach(callbackfn)
}

const shallowMergeContext = (target: Context, source: Context): Context => {
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

export const createGlobalObject = (
  globals: Context,
  useCurrentGlobal: boolean
): Map<string | symbol, any> => {
  const globalMap = new Map()

  if (useCurrentGlobal) {
    const currentGlobal = getCurrentGlobal()
    Object.getOwnPropertyNames(currentGlobal).forEach(key => {
      globalMap.set(key, currentGlobal[key])
    })
    Object.getOwnPropertySymbols(currentGlobal).forEach(key => {
      // @ts-expect-error: safe to ignore
      globalMap.set(key, currentGlobal[key])
    })
  }

  // Add user globals to Map (protected from pollution)
  Object.getOwnPropertyNames(globals).forEach(key => {
    globalMap.set(key, globals[key])
  })
  Object.getOwnPropertySymbols(globals).forEach(key => {
    // @ts-expect-error: safe to ignore
    globalMap.set(key, globals[key])
  })

  return globalMap
}

export const createContextObject = (
  moduleContext: Context,
  globalMap: Map<string | symbol, any>
): Context => {
  const contextObject: Context = { ...moduleContext }

  // Convert Map back to object for VM context, but only with safe values
  globalMap.forEach((value, key) => {
    contextObject[key as keyof Context] = value
  })

  if (!('global' in contextObject)) {
    contextObject.global = contextObject
  }
  return contextObject
}

export const resolveModuleSpecifier = (specifier: string, dirname: string): string => {
  if (isFileURL(specifier)) {
    return specifier
  }
  return specifier.startsWith('.') || isAbsolute(specifier)
    ? resolve(ensurePath(dirname), specifier)
    : specifier
}
