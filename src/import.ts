import { TransformOptions, transform, transformSync } from 'esbuild'
import { Options, requireFromString } from './require'
import { checkArg } from './utils'

interface ImprotOptions extends Options {
  transformOptions?: TransformOptions
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

  return requireFromString({ code: transformedCode, globals })
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

  return requireFromString({ code: transformedCode, globals })
}
