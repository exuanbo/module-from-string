import { TransformOptions, transform, transformSync } from 'esbuild'
import { Options, requireFromString } from './require'
import { generateOptions } from './utils'

export interface ImportOptions extends Options {
  transformOptions?: TransformOptions
}

const generateTransformOptions = (
  transformOptions: TransformOptions
): TransformOptions => ({ format: 'cjs', ...transformOptions })

export const importFromString = async (
  options: string | ImportOptions
): Promise<any> => {
  const { code, transformOptions = {}, globals = {} } = generateOptions(options)

  const transformResult = await transform(
    code,
    generateTransformOptions(transformOptions)
  )

  return requireFromString({ code: transformResult.code, globals })
}

export const importFromStringSync = (options: string | ImportOptions): any => {
  const { code, transformOptions = {}, globals = {} } = generateOptions(options)

  const transformResult = transformSync(
    code,
    generateTransformOptions(transformOptions)
  )

  return requireFromString({ code: transformResult.code, globals })
}
