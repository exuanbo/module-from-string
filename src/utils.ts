export const checkArg = (arg: unknown): void | never => {
  const argType = typeof arg
  if (argType !== 'string') {
    throw new Error(`Argument must be string, not '${argType}'.`)
  }
}
