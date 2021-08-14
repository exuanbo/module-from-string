export const isInESModuleScope = (): boolean => {
  try {
    return module === undefined
  } catch {
    return true
  }
}

export class ESModuleNotSupportedError extends Error {
  constructor(functionName: string) {
    super(`${functionName} can not run in ES module scope
Use importFromString instead and execute node with --experimental-vm-modules command flag.`)
  }
}

export class VmModuleNotEnabledError extends Error {
  constructor() {
    super('command flag --experimental-vm-modules is not enabled')
  }
}
