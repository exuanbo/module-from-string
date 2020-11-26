import { TransformOptions, transform, transformSync } from 'esbuild'
import { requireFromString } from './require'
import { checkArg } from './utils'

interface ImprotOptions {
  code: string
  transformOptions?: TransformOptions
  globals?: Record<string, unknown>
}

export const importFromString = async ({
  code,
  transformOptions,
  globals = {}
}: ImprotOptions): Promise<any> => {
  checkArg(code)

  const { code: transformedCode } = await transform(code, {
    format: 'cjs',
    ...transformOptions
  })

  return requireFromString(transformedCode, globals)
}

export const importFromStringSync = ({
  code,
  transformOptions,
  globals = {}
}: ImprotOptions): any => {
  checkArg(code)

  const { code: transformedCode } = transformSync(code, {
    format: 'cjs',
    ...transformOptions
  })

  return requireFromString(transformedCode, globals)
}
