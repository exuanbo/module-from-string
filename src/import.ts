import { TransformOptions, transformSync } from 'esbuild'
import { requireFromString } from './require'
import { checkArg } from './utils'

interface ImprotOptions {
  code: string
  transformOptions?: TransformOptions
  globals?: Record<string, unknown>
}

export const importFromString = ({
  code,
  transformOptions,
  globals
}: ImprotOptions): any => {
  checkArg(code)

  const { code: transformedCode } = transformSync(code, {
    format: 'cjs',
    ...transformOptions
  })

  return requireFromString(transformedCode, globals)
}
