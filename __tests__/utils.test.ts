import { checkArg } from '../src/utils'

it('should throw error if argument is not string', () => {
  expect.assertions(1)
  try {
    checkArg(module)
  } catch (err) {
    expect(err.message).toBe("Argument must be string, not 'object'.")
  }
})
