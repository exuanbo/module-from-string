export const isInESModuleScope = (): boolean => {
  try {
    return module === undefined
  } catch {
    return true
  }
}

export const getESModuleError = (functionName: string): Error => {
  return new Error(
    `function \`${functionName}\` does not work in ES module scope
Use \`importFromString\` instead and execute node with \`--experimental-vm-modules\` command flag.`
  )
}
